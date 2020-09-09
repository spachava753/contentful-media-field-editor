import {FieldExtensionSDK} from "contentful-ui-extensions-sdk";
import React, {isValidElement, useEffect, useMemo, useState} from "react";
import {HelpText, Button} from "@contentful/forma-36-react-components";
import "@contentful/forma-36-react-components";
import {Dashboard} from '@uppy/react';
import Uppy from '@uppy/core';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import AwsS3 from "@uppy/aws-s3";
import {apiKey, url} from "./cred";
import '@contentful/forma-36-react-components/dist/styles.css';

interface AppProps {
    sdk: FieldExtensionSDK;
}

interface PreviewProps {
    fileUrl: string;
    fileName: string;
    fileExtension: string;
}

interface FileMetaData {
    fileUrl: string;
    fileName: string;
    fileExtension: string;
}

function Preview(props: PreviewProps) {
    const {fileUrl, fileName, fileExtension} = props;
    return (
        <>
            <p>{fileUrl}</p>
            <img src={fileUrl}/>
        </>
    )
}

export function App(props: AppProps) {
    const {sdk} = props;

    console.log(sdk.field)
    const [appReady, setAppReady] = useState(false);
    const [fileData, setFileData] = useState({});
    const [uploaded, setUploaded] = useState(false);
    console.log(JSON.stringify(fileData))
    console.log(uploaded)

    useEffect(() => {
        if (sdk.field != undefined && !appReady) {
            const v = sdk.field.getValue();
            if (v == undefined) {
                setFileData(v)
                setUploaded(false)
            } else {
                setFileData(JSON.parse(v))
                setUploaded(true)
            }
            setAppReady(true)
        }
    }, [sdk.field])

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
                return fetch(url, {
                    method: 'post',
                    headers: {
                        'x-api-key': apiKey
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
        });
    }, [])

    const deleteMedia = () => {
        console.log(`Deleting ${fileData["uuid"]}.${fileData["ext"]}`)
        fetch(url, {
            method: 'post',
            headers: {
                'x-api-key': apiKey
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

    useEffect(() => {
        sdk.window.startAutoResizer();
        return () => {
            uppy.close()
        }
    }, [])

    return (
        <>
            {(!uploaded && appReady) &&
            <div>
              <Dashboard
                uppy={uppy}
                plugins={['GoogleDrive']}
              />
            </div>}
            {(uploaded && appReady) &&
            <div><Preview fileUrl={fileData["url"]} fileName={fileData["uuid"]} fileExtension={fileData["ext"]}/>
              <Button buttonType="negative" onClick={deleteMedia}>Delete</Button></div>}
            <HelpText><i>Upload a file (image, video, podcast) to see a preview</i></HelpText>
        </>
    );
}