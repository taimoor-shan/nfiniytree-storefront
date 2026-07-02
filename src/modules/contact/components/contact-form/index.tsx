"use client"

import { Button, Heading, Input, Textarea, Text } from "@medusajs/ui"
import { useState } from "react"
import { sdk } from "@lib/config"

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    }

    try {
      // Use standard fetch here because custom /store/contact route might not be in the generated SDK typings yet
      // but we use the SDK's fetch method to include the publishable API key
      await sdk.client.fetch("/store/contact", {
        method: "POST",
        body: data,
      })
      
      setStatus("success")
      ;(e.target as HTMLFormElement).reset()
    } catch (err: any) {
      console.error("Contact form error:", err)
      setStatus("error")
      // err.message from the SDK FetchError is either the response body's `message`
      // field or the HTTP statusText — both are user-safe to display.
      // If the backend returned a Zod validation error array, stringify it.
      const message = Array.isArray(err.message)
        ? err.message.map((m: any) => m.message || m).join(", ")
        : err.message
      setErrorMessage(message || "Something went wrong. Please try again.")
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-y-4 p-8 border border-hairline rounded-lg bg-surface-card text-center">
        <Heading level="h2" className="text-xl">Message Sent</Heading>
        <Text className="text-body">
          Thank you for reaching out. We have received your message and will get back to you shortly.
        </Text>
        <Button 
          variant="secondary" 
          onClick={() => setStatus("idle")}
          className="mt-4 w-fit mx-auto"
        >
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-y-2">
          <label htmlFor="name" className="text-sm font-medium text-ink">
            Name <span className="text-error">*</span>
          </label>
          <Input id="name" name="name" placeholder="Your full name" />
        </div>
        
        <div className="flex flex-col gap-y-2">
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email <span className="text-error">*</span>
          </label>
          <Input id="email" name="email" placeholder="your.email@example.com" />
        </div>
      </div>

      <div className="flex flex-col gap-y-2">
        <label htmlFor="subject" className="text-sm font-medium text-ink">
          Subject <span className="text-error">*</span>
        </label>
        <Input id="subject" name="subject" placeholder="What is this regarding?" />
      </div>

      <div className="flex flex-col gap-y-2">
        <label htmlFor="message" className="text-sm font-medium text-ink">
          Message <span className="text-error">*</span>
        </label>
        <Textarea
          id="message"
          name="message"
          placeholder="How can we help you?"
          rows={6}
        />
      </div>

      {status === "error" && (
        <Text className="text-error text-sm">{errorMessage}</Text>
      )}

      <Button 
        type="submit" 
        size="large" 
        isLoading={status === "loading"}
        className="w-full sm:w-auto"
      >
        Send Message
      </Button>
    </form>
  )
}
