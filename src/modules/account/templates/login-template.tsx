"use client"

import { useState } from "react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const LoginTemplate = ({
  referrerName,
}: {
  /** The sales rep whose client link the visitor followed: the form to join comes first */
  referrerName?: string | null
}) => {
  const [currentView, setCurrentView] = useState(
    referrerName ? LOGIN_VIEW.REGISTER : LOGIN_VIEW.SIGN_IN
  )

  return (
    <div className="w-full flex justify-start px-8 py-8">
      {currentView === "sign-in" ? (
        <Login setCurrentView={setCurrentView} />
      ) : (
        <Register setCurrentView={setCurrentView} referrerName={referrerName} />
      )}
    </div>
  )
}

export default LoginTemplate
