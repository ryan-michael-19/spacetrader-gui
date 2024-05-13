import { useState, Dispatch, SetStateAction } from 'react';
import { NewKeyPopUp } from './NewKeyPopup';

export function LoginPage({ setLoggedIn }: {setLoggedIn: Dispatch<SetStateAction<string>>}) {
    const [displayNewKeyPopup, setDisplayNewKeyPopup] = useState<boolean>();
    const [inputAuthKey, setInputAuthKey] = useState<string>("");
    return (
        <>
            <h1>Welcome</h1>
            <div id="login">
                <label htmlFor="auth-key">Enter your auth key:</label>
                <input id="auth-key" type="text" onChange={e => {setInputAuthKey(e.target.value)}}/>
                <button id='get-agent-data' onClick={() => setLoggedIn(inputAuthKey)}>Get Agent Data</button>
            </div>
            {
                displayNewKeyPopup ?
                    <NewKeyPopUp closePopupFunc={() => setDisplayNewKeyPopup(false)}/>
                    :
                    null
            }
            <button id="get-new-key-popup" onClick={() => setDisplayNewKeyPopup(true)}>Get New Key</button>
        </>
    )
}