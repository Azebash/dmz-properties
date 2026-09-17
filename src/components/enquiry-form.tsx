"use client";

import { FormEvent, startTransition, useState } from "react";

type FormState = {
  status: "idle" | "submitting" | "success" | "error";
  message: string;
};

type EnquiryFormProps = {
  defaultInterest?: string;
  propertyReference?: string;
  submitLabel?: string;
};

const initialState: FormState = { status: "idle", message: "" };

export function EnquiryForm({
  defaultInterest = "",
  propertyReference = "",
  submitLabel = "Send enquiry",
}: EnquiryFormProps) {
  const [state, setState] = useState<FormState>(initialState);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));

    setState({ status: "submitting", message: "Sending your enquiry..." });

    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || "We could not send your enquiry.");
      }

      form.reset();
      startTransition(() => {
        setState({
          status: "success",
          message: "Your enquiry has been received. We will respond shortly.",
        });
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "We could not send your enquiry. Please try again.",
      });
    }
  }

  return (
    <form className="enquiry-form" onSubmit={handleSubmit}>
      {propertyReference ? (
        <div className="form-property field-full">
          <span>Property reference</span>
          <strong>{propertyReference}</strong>
          <input
            name="propertyReference"
            type="hidden"
            value={propertyReference}
          />
        </div>
      ) : null}
      <div className="field">
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          maxLength={100}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={200}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="phone">Phone or WhatsApp</label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          maxLength={40}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="location">Current location</label>
        <input
          id="location"
          name="location"
          autoComplete="country-name"
          maxLength={100}
        />
      </div>
      <div className="field">
        <label htmlFor="interest">I am interested in</label>
        <select
          id="interest"
          name="interest"
          defaultValue={defaultInterest}
          required
        >
          <option value="" disabled>
            Select one
          </option>
          <option value="Buying a plot">Buying a plot</option>
          <option value="Buying a developed property">
            Buying a developed property
          </option>
          <option value="Selling my KYC Homes Phase II property">
            Selling my KYC Homes Phase II property
          </option>
          <option value="Booking an inspection">Booking an inspection</option>
          <option value="General question">General question</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="timeline">Expected timeline</label>
        <select id="timeline" name="timeline" defaultValue="">
          <option value="">Not decided</option>
          <option>Immediately</option>
          <option>Within 3 months</option>
          <option>Within 6 months</option>
          <option>Later this year</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="inspection-preference">Inspection preference</label>
        <select
          id="inspection-preference"
          name="inspectionPreference"
          defaultValue=""
        >
          <option value="">Not decided</option>
          <option>Physical inspection</option>
          <option>Live video inspection</option>
          <option>Representative inspection</option>
        </select>
      </div>
      <div className="field">
        <label htmlFor="contact-method">Preferred contact method</label>
        <select id="contact-method" name="contactMethod" defaultValue="WhatsApp" required>
          <option>WhatsApp</option>
          <option>Phone</option>
          <option>Email</option>
        </select>
      </div>
      <div className="field field-full">
        <label htmlFor="contact-time">Preferred contact time</label>
        <input
          id="contact-time"
          name="contactTime"
          maxLength={100}
          placeholder="Include your time zone if outside Nigeria"
        />
      </div>
      <div className="field field-full">
        <label htmlFor="budget">Budget or expected selling price</label>
        <input
          id="budget"
          name="budget"
          maxLength={100}
          placeholder="Include currency"
        />
      </div>
      <div className="field field-full">
        <label htmlFor="message">Property requirements or details</label>
        <textarea id="message" name="message" maxLength={3000} required />
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="consent-field field-full">
        <input name="consent" type="checkbox" value="accepted" required />
        <span>
          I agree that DMZ Properties may use these details to respond to my
          enquiry as described in the privacy policy.
        </span>
      </label>
      <button
        className="button button-primary field-full"
        type="submit"
        disabled={state.status === "submitting"}
      >
        {state.status === "submitting" ? "Sending..." : submitLabel}
      </button>
      {state.message ? (
        <p
          className={`form-status form-status-${state.status}`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
