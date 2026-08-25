"use client"

import { Button, Heading, Text } from "@medusajs/ui"
import Input from "@modules/common/components/input"
import Textarea from "@modules/common/components/textarea"
import { useEffect, useRef, useState } from "react"
import { sdk } from "@lib/config"
import { useTranslation } from "@lib/i18n/client"

export default function ContactForm() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const successPanelRef = useRef<HTMLDivElement>(null)

  // Submitting swaps the form out for a confirmation panel. Without moving
  // focus, a keyboard/screen-reader user is left on a button that no longer
  // exists and never hears that the message was sent.
  useEffect(() => {
    if (status === "success") {
      successPanelRef.current?.focus()
    }
  }, [status])

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
      setErrorMessage(message || t("contact.form.error"))
    }
  }

  if (status === "success") {
    return (
      <div
        role="status"
        ref={successPanelRef}
        tabIndex={-1}
        className="flex flex-col gap-y-4 p-8 border border-hairline rounded-lg bg-surface-card text-center outline-none"
      >
        <Heading level="h2" className="text-xl">
          {t("contact.form.success")}
        </Heading>
        <Text className="text-body">
          {t("contact.form.successText")}
        </Text>
        <Button
          variant="secondary"
          onClick={() => setStatus("idle")}
          className="mt-4 w-fit mx-auto"
        >
          {t("contact.form.sendAnother")}
        </Button>
      </div>
    )
  }

  return (
    // This form uses the storefront's common Input/Textarea components — the
    // same ones as checkout — which wire label, `required`, error and helper
    // text together and only ever paint an error border through the `error`
    // prop. They never react to the eager `:invalid` CSS pseudo-class, so a
    // fresh form shows neutral fields. Native `required`/type validation is
    // left enabled and announced by the browser when the user submits.
    <form onSubmit={handleSubmit} className="flex flex-col gap-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label={t("contact.form.name")}
          name="name"
          autoComplete="name"
          required
          data-testid="contact-name-input"
        />

        <Input
          label={t("contact.form.email")}
          name="email"
          type="email"
          autoComplete="email"
          title={t("common.emailNotValid")}
          required
          data-testid="contact-email-input"
        />
      </div>

      <Input
        label={t("contact.form.subject")}
        name="subject"
        required
        data-testid="contact-subject-input"
      />

      <Textarea
        label={t("contact.form.message")}
        name="message"
        required
        rows={6}
        helperText={t("contact.form.messagePlaceholder")}
        data-testid="contact-message-input"
      />

      {status === "error" && (
        <Text role="alert" className="text-error text-sm">
          {errorMessage}
        </Text>
      )}

      <Button
        type="submit"
        size="large"
        isLoading={status === "loading"}
        className="w-full sm:w-auto"
      >
        {t("contact.form.submit")}
      </Button>
    </form>
  )
}
