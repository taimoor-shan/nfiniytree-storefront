"use client"

import { useState } from "react"
import { clx } from "@medusajs/ui"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("loading")
    
    // Simulate API call
    setTimeout(() => {
      setStatus("success")
      setEmail("")
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full mt-4 relative">
      <div className="flex max-w-[400px]">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="youremail@example.com" 
          className="flex-grow border border-hairline px-4 rounded-l-sm bg-canvas text-base focus:outline-none focus:border-primary text-ink"
          required
          disabled={status === "loading" || status === "success"}
        />
        <button 
          type="submit" 
          disabled={status === "loading" || status === "success"}
          className={clx(
            "btn-primary rounded-l-none",
            status === "success" && "bg-success hover:bg-success",
            (status === "loading" || status === "success") && "opacity-75 cursor-not-allowed"
          )}
        >
          {status === "loading" ? "..." : status === "success" ? "Done!" : "Submit"}
        </button>
      </div>
      {status === "success" && (
        <p className="text-sm text-success mt-2 absolute -bottom-6">Thank you for subscribing!</p>
      )}
    </form>
  )
}
