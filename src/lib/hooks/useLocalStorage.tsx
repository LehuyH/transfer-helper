"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, init: () => T):[T,Dispatch<SetStateAction<T>>] {
    const [val, setVal] = useState(init())
    const [firstLoadDone, setFirstLoadDone] = useState(false);
    useEffect(() => {
        if (!window.localStorage.getItem(key)) {
            window.localStorage.setItem(key, JSON.stringify(init()))
        }

        const startingValue = (!window.localStorage.getItem(key)) ? init()
            : JSON.parse(window.localStorage.getItem(key)!) as T

        setVal(startingValue)
    }, [])

    
    useEffect(() => {
        if(!firstLoadDone){
            setFirstLoadDone(true)
            return;
        }
        window.localStorage.setItem(key, JSON.stringify(val))
    }, [val])

    return [val as T, setVal]
}