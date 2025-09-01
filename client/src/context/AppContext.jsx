
import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify"
import axios from "axios";

axios.defaults.withCredentials = true; 

export const AppContext = createContext()

export const AppContextProvider = (props) => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [userData, setUserData] = useState(null)

    const getAuthState = async () => {
        try {
            const {data} = await axios.get(backendUrl+'/api/auth/is-auth', {withCredentials:true})
            if(data.success) {
                setIsLoggedIn(true)
                await getUserData()
            } else {
                setIsLoggedIn(false)
            }
        } catch(error) {
            setIsLoggedIn(false) // 401 is expected if not logged in
        }
    }

    const getUserData = async () => {
        try
        {
            const {data} = await axios.get(backendUrl+'/api/user/data',{withCredentials: true})
            if (data.success) {
      setUserData(data.userData);
    } else {
      // Only show error if user is logged in
      if (isLoggedIn) {
        toast.error(data.message);
      }
      setUserData(null);
    }
        }
        catch(error)
        {
            toast.error(error.message)   
        }
    }

    useEffect(() => {
        getAuthState();
    }, [])

    const value = {
        backendUrl,
        isLoggedIn, setIsLoggedIn,
        userData, setUserData,
        getUserData
    }

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}