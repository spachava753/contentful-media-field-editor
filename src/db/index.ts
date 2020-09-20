import axios from 'axios';

export enum EntryState {
    EDITABLE,
    EDITING,
    READ_ONLY
}

let URL: string, apiKey: string;
let entryUrl: string, entryApiKey: string;

export function setEntryUrl(url: string) {
    entryUrl = url;
}

export function setEntryApiKey(key: string) {
    entryApiKey = key;
}

export function getUrl() {
    return URL;
}

export function getApiKey() {
    return apiKey;
}

export function setUrl(url: string) {
    URL = url;
}

export function setApiKey(key: string) {
    apiKey = key;
}

export async function getEntryStatus(entryId: string) {
    return await axios.get(entryUrl + `${entryId}/status`, {
        headers: {
            'x-api-key': entryApiKey
        }
    });
}