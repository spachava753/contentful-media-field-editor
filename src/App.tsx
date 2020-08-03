import {FieldExtensionSDK} from "contentful-ui-extensions-sdk";
import React, {useEffect} from "react";
import {HelpText} from "@contentful/forma-36-react-components";
import {Dashboard} from '@uppy/react';
import Tus from '@uppy/tus';
import Uppy from '@uppy/core';
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

interface AppProps {
    sdk: FieldExtensionSDK;
}

const uppy = Uppy<Uppy.StrictTypes>({
    id: 'uppy',
    autoProceed: true,
    debug: true,
    meta: {type: 'avatar'},
    restrictions: {maxNumberOfFiles: 1}
});

uppy.use(Tus, { endpoint: '/upload' });



export function App(props: AppProps) {
    const {sdk} = props;

    useEffect(() => {
        sdk.window.startAutoResizer();
    }, [])

    return (
        <>
            <Dashboard
                uppy={uppy}
                plugins={['GoogleDrive']}
                metaFields={[
                    {id: 'name', name: 'Name', placeholder: 'File name'}
                ]}
            />
            <HelpText><i>Upload a file (image, video, podcast) to see a preview</i></HelpText>
        </>
    );

}