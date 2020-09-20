import {FieldExtensionSDK} from "contentful-ui-extensions-sdk";
import React, {isValidElement, useEffect, useMemo, useState} from "react";
import {HelpText, Button} from "@contentful/forma-36-react-components";
import "@contentful/forma-36-react-components";
import {Dashboard} from '@uppy/react';
import Uppy, {UppyFile} from '@uppy/core';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import AwsS3 from "@uppy/aws-s3";
import '@contentful/forma-36-react-components/dist/styles.css';
import {EntryState, getEntryStatus, setEntryApiKey, setApiKey, setUrl, setEntryUrl, getApiKey, getUrl} from "./db";
import _ from 'lodash-es';
import {useEffectOnce} from "react-use";

interface AppProps {
    sdk: FieldExtensionSDK;
}

interface PreviewProps {
    fileUrl: string;
    fileName: string;
    fileExtension: string;
}

interface FileMetaData {
    url: string;
    uuid: string;
    ext: string;
}

function parseURL(url: string): FileMetaData {
    const parsedURL = new URL(url)
    let result = {
        "url": "",
        "uuid": "",
        "ext": ""
    }
    parsedURL.pathname
    console.log(parsedURL.pathname)
    if (parsedURL.pathname.includes("images")) {
        result['url'] = url
        console.log(parsedURL.pathname.split("/images/")[1])
        const fileName = parsedURL.pathname.split("/images/")[1];
        const fileMeta = fileName.split(".")
        result['uuid'] = fileMeta[0];
        result['ext'] = fileMeta[1];
    } else {
        result['url'] = url
        const fileName = parsedURL.pathname.split("/")[1];
        const fileMeta = fileName.split(".")
        result['uuid'] = fileMeta[0];
        result['ext'] = fileMeta[1];
    }
    return result
}

const isImage = (ext: string) => {
    switch (ext) {
        case "png":
        case "jpg":
        case "JPG":
        case "jpeg":
        case "gif":
            return true
        default:
            return false
    }
};

const isVideo = (ext: string) => {
    switch (ext) {
        case "wav":
        case "mp4":
            return true
        default:
            return false
    }
};

function Preview(props: PreviewProps) {
    const {fileUrl, fileName, fileExtension} = props;
    return (
        <>
            <p>{fileName}.{fileExtension}</p>
            {isImage(fileExtension) &&
            <img src={fileUrl} alt="Could not show preview. Maybe refresh?"
                 style={{maxWidth: "100%", height: "auto"}}/>}
            {isVideo(fileExtension) && <video width="400" controls style={{maxWidth: "100%", height: "auto"}}>
              <source src={fileUrl} type={`video/${fileExtension}`}/>
              Your browser does not support HTML video.</video>
            }
        </>
    )
}

export function App(props: AppProps) {
    const {sdk} = props;

    console.log(sdk.field)
    const [sdkReady, setSdkReady] = useState(false);
    const [fileData, setFileData] = useState({});
    const [uploaded, setUploaded] = useState(false);
    console.log(JSON.stringify(fileData))
    console.log(uploaded)

    useEffect(() => {
            if (sdk.field != undefined && !sdkReady) {
                const v = sdk.field.getValue();
                if (v == undefined) {
                    setFileData(v)
                    setUploaded(false)
                } else {
                    let d;
                    try {
                        d = JSON.parse(v)
                        setFileData(d)
                    } catch (e) {
                        console.log(e)
                        setFileData(parseURL(v))
                        //setFileData(JSON.parse(v))
                    }
                    setUploaded(true)
                }
                setSdkReady(true)
            }
        },
        [sdk.field]
    )

    const uppy = useMemo(() => {
        let temp;
        return Uppy<Uppy.StrictTypes>({
            id: 'uppy',
            autoProceed: false,
            debug: true,
            restrictions: {maxNumberOfFiles: 1},
        }).use(AwsS3, {
            limit: 1,
            timeout: 1000 * 3600,
            getUploadParameters(file) {
                return fetch(getUrl(), {
                    method: 'post',
                    headers: {
                        'x-api-key': getApiKey()
                    },
                    body: JSON.stringify({
                        "operation": "upload",
                        "extension": file.extension
                    })
                }).then(data => {
                    return data.json()
                }).then(uploadData => {
                    console.log(JSON.stringify(uploadData))
                    temp = {
                        "url": uploadData.url,
                        "uuid": uploadData.uuid,
                        "ext": file.extension
                    }
                    setFileData(temp);
                    return {
                        method: "POST",
                        url: uploadData.data.url,
                        fields: uploadData.data.fields,
                        headers: {}
                    }
                })
            }
        }).on('upload-success', (file, response) => {
            console.log("Uploaded")
            console.log(JSON.stringify(file))
            console.log(JSON.stringify(response))
            console.log(JSON.stringify(temp))
            console.log(`typeof: ${typeof temp}`)
            sdk.field.setValue(JSON.stringify(temp)).then(() => {
                setUploaded(true);
            }).catch(err => {
                console.log(`ENTRY UPDDDDAATE FAIILED: ${err}`)
            })
        }).on('file-added', (file: UppyFile) => {
            console.log("File added")
            console.log(JSON.stringify(file))
            // get entry status when file is added
            getEntryStatus(sdk.entry.getSys().id).then(r => {
                console.log(r)
                return r.data
            }).then(data => {
                if (!_.isEmpty(data)) {
                    if (data.entryState == EntryState[EntryState.EDITABLE]) {
                        // entry is editable but not checked out
                        sdk.dialogs.openAlert({
                            title: 'Directions!',
                            message: 'You are viewing the current entry in read only mode! ' +
                                'Click on the big blue button the right',
                            shouldCloseOnEscapePress: true,
                            shouldCloseOnOverlayClick: true
                        });
                        uppy.removeFile(file.id)
                    } else {
                        // entry is not editable
                        if (data['userId'] != sdk.user.sys.id) {
                            sdk.dialogs.openAlert({
                                title: 'Warning!',
                                message:
                                    'You are viewing the current entry when someone else is editing it. ' +
                                    'You can view the current entry in read only mode!',
                                shouldCloseOnEscapePress: true,
                                shouldCloseOnOverlayClick: true
                            });
                            uppy.removeFile(file.id)
                        }
                    }
                } else {
                    // entry doesn't exist in db,
                    sdk.dialogs.openAlert({
                        title: 'Directions!',
                        message: 'You are viewing the current entry in read only mode! ' +
                            'Click on the big blue button the right',
                        shouldCloseOnEscapePress: true,
                        shouldCloseOnOverlayClick: true
                    });
                    uppy.removeFile(file.id)
                }
            })
        });
    }, [])

    useEffectOnce(() => {
        sdk.window.startAutoResizer();
        console.log(`App params: ${JSON.stringify(sdk.parameters.installation)}`);
        const params = sdk.parameters.installation as any;
        setEntryUrl(params['entryApiUrl']);
        setEntryApiKey(params['entryApiKey']);
        setUrl(params['url']);
        setApiKey(params['apiKey']);
        return () => {
            uppy.close()
            sdk.window.stopAutoResizer();
        }
    });

    const deleteMedia = () => {
        console.log(`Deleting ${fileData["uuid"]}.${fileData["ext"]}`)
        fetch(getUrl(), {
            method: 'post',
            headers: {
                'x-api-key': getApiKey()
            },
            body: JSON.stringify({
                "uuid": fileData["uuid"],
                "operation": "delete",
                "extension": fileData["ext"]
            })
        }).then(() => {
            sdk.field.removeValue().then(() => {
                setFileData({})
                setUploaded(false)
            })
        })
    }

    return (
        <>
            {(!uploaded && sdkReady) &&
            <div>
              <Dashboard
                uppy={uppy}
                plugins={['GoogleDrive']}
              />
            </div>}
            {(uploaded && sdkReady) &&
            <div><Preview fileUrl={fileData["url"]} fileName={fileData["uuid"]} fileExtension={fileData["ext"]}/><br/>
              <Button buttonType="negative" onClick={deleteMedia}>Delete</Button></div>}
            <HelpText><i>Upload a file (image, video, podcast) to see a preview</i></HelpText>
        </>
    );
}