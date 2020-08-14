import {FieldExtensionSDK} from "contentful-ui-extensions-sdk";
import React, {useEffect, useMemo, useState} from "react";
import {HelpText} from "@contentful/forma-36-react-components";
import {Dashboard} from '@uppy/react';
import Uppy from '@uppy/core';
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import AwsS3 from "@uppy/aws-s3";
import {apiKey, url} from "./cred";

interface AppProps {
    sdk: FieldExtensionSDK;
}

export function App(props: AppProps) {
    const {sdk} = props;

    const [filename, setFilename] = useState(sdk.field.getValue());

    const uppy = useMemo(() => {
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
                        "file_name": file.name,
                        "extension": file.extension
                    })
                }).then(data => {
                    return data.json()
                }).then(uploadData => {
                    console.log(JSON.stringify(uploadData))
                    return {
                        method: "POST",
                        url: uploadData.url,
                        fields: uploadData.fields,
                        headers: {}
                    }
                })
            }
        }).on('upload-success', (file, response) => {
            console.log(JSON.stringify(file))
            console.log(JSON.stringify(response))
            sdk.field.setValue(file.name).then(f => setFilename(f))
        });
    }, [])

    useEffect(() => {
        sdk.window.startAutoResizer();
        return () => {
            uppy.close()
        }
    }, [])

    return (
        <>
            {filename || <Dashboard
              uppy={uppy}
              plugins={['GoogleDrive']}
                //hideUploadButton={true}
            />}
            <HelpText><i>Upload a file (image, video, podcast) to see a preview</i></HelpText>
        </>
    );
}