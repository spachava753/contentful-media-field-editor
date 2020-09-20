import React, { useEffect, useState } from 'react';
import { AppExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Form, Heading, Note, TextField } from '@contentful/forma-36-react-components';
import _ from 'lodash-es';
import { useAsync } from 'react-use';
import {setApiKey, setEntryApiKey, setEntryUrl, setUrl} from "./db";

interface ConfigProps {
    sdk: AppExtensionSDK;
}

export function Config(props: ConfigProps) {
    console.log('In Config screen');

    const [url, setUrlValue] = useState('');
    const [apiKey, setApiKeyValue] = useState('');
    const [entryApiUrl, setEntryApiUrlValue] = useState('');
    const [entryApiKey, setEntryApiKeyValue] = useState('');
    const { sdk } = props;
    const app = sdk.app;

    useEffect(() => {
        async function getParams() {
            const p: any = await app.getParameters();
            console.log(`Fetched app params are ${JSON.stringify(p)}`);
            if (!_.isEmpty(p)) {
                setUrlValue(p['url']);
                setApiKeyValue(p['apiKey']);
                setEntryApiUrlValue(p['entryApiUrl']);
                setEntryApiKeyValue(p['entryApiKey']);
            }
            console.log(`Setting app ready`);
            await app.setReady();
        }

        getParams().then();
    }, []);

    useAsync(async () => {
        const parameters = { url, apiKey, entryApiUrl, entryApiKey };
        console.log(`Saving app params as: ${JSON.stringify(parameters)}`);
        await app.onConfigure(async () => {
            const { items: contentTypes } = await sdk.space.getContentTypes();
            // @ts-ignore
            const contentTypeIds = contentTypes.map(ct => ct.sys.id);
            console.log(`Content types to configure: ${contentTypeIds}`);
            const editorInterface = contentTypeIds.reduce((acc, id) => {
                // Insert the app as the first item in sidebars
                // of all content types.
                return { ...acc, [id]: { sidebar: { position: 0 } } };
            }, {});
            console.log(`Editor Interface: ${JSON.stringify(editorInterface)}`);

            return {
                parameters: parameters,
                targetState: {
                    //EditorInterface: editorInterface
                }
            };
        });
    }, [url, apiKey, entryApiUrl, entryApiKey]);

    app.onConfigurationCompleted((err: any) => {
        if (err) {
            console.log(`There were errors installing: ${JSON.stringify(err)}`);
        }
    });

    return (
        <Form style={{ width: '500px', margin: '50px auto' }}>
            <Heading>Editor Checkout App</Heading>
            <Note noteType="primary" title="About the app">
                The editor will ensure that concurrent editing is not possible. However, we need to
                connect to a database to track an entry's state. Enter the access key id and secret
                access id key of a user that can read and write items to a DynamoDB table.
            </Note>
            <TextField
                required
                name="API Gateway Endpoint"
                id="endpointInput"
                labelText={'API Gateway Endpoint for uploading and deleting media'}
                value={url}
                onChange={e => {
                    setUrlValue((e.currentTarget as any).value);
                }}
                textInputProps={{
                    withCopyButton: true,
                    placeholder: 'https://<some-endpoint>.execute-api.<some-region>.amazonaws.com/'
                }}
                helpText={'Editors: Ask your developers to install'}
            />
            <TextField
                name="API Key"
                id="apiKeyInput"
                labelText={'API Key to use when uploading and deleting media, if there is any API key'}
                value={apiKey}
                onChange={e => {
                    setApiKeyValue((e.currentTarget as any).value);
                }}
                textInputProps={{
                    withCopyButton: false,
                    placeholder: 'gn@7N0zJ34q5s^M7%8mXbd6rRFRf%MuXfQLtZSCb'
                }}
                helpText={'Note: the placeholder key is not real'}
            />
            <TextField
                required
                name="Entry API Gateway Endpoint"
                id="entryEndpointInput"
                labelText={'API Gateway Endpoint for getting entry state'}
                value={entryApiUrl}
                onChange={e => {
                    setEntryApiUrlValue((e.currentTarget as any).value);
                }}
                textInputProps={{
                    withCopyButton: true,
                    placeholder: 'https://<some-endpoint>.execute-api.<some-region>.amazonaws.com/'
                }}
                helpText={'Editors: Ask your developers to install'}
            />
            <TextField
                name="Entry API Key"
                id="entryEpiKeyInput"
                labelText={'API Key to use when contacting the entry endpoints, if there is any API key'}
                value={entryApiKey}
                onChange={e => {
                    setEntryApiKeyValue((e.currentTarget as any).value);
                }}
                textInputProps={{
                    withCopyButton: false,
                    placeholder: 'gn@7N0zJ34q5s^M7%8mXbd6rRFRf%MuXfQLtZSCb'
                }}
                helpText={'Note: the placeholder key is not real'}
            />
        </Form>
    );
}
