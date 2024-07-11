import { useState } from 'react';
import { LoginPage } from './LoginPage';
import { MainPage } from './MainPage';
import createClient from 'openapi-fetch';
import type { paths } from "../lib/types";
export function App() {
    const [logInAuthKey, setLogInAuthKey] = useState<string>("");
    return (
        <>
        {
            logInAuthKey === "" ? 
                <LoginPage setLoggedIn={setLogInAuthKey}/>
                :
                <MainPage client={
                    createClient<paths>({
                        baseUrl: 'https://api.spacetraders.io/v2/',
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${logInAuthKey}`
                        }
                    })
                }
                />
        }
        </>
    )
}