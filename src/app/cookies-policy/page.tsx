import React from "react";

export default function CookiesPolicyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-4">Cookies Policy</h1>
      <p className="mb-4 text-muted-foreground">
        This Cookies Policy explains how we use cookies and similar technologies on our website. By using our site, you consent to the use of cookies as described in this policy.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">What are cookies?</h2>
      <p className="mb-4 text-muted-foreground">
        Cookies are small text files stored on your device by your web browser. They help us improve your experience, remember your preferences, and analyze site usage.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">How we use cookies</h2>
      <ul className="list-disc pl-6 mb-4 text-muted-foreground">
        <li>Essential cookies for site functionality</li>
        <li>Analytics cookies to understand usage</li>
        <li>Preference cookies to remember your settings</li>
      </ul>
      <h2 className="text-xl font-semibold mt-8 mb-2">Managing cookies</h2>
      <p className="mb-4 text-muted-foreground">
        You can control and delete cookies through your browser settings. However, disabling cookies may affect your experience on our site.
      </p>
      <h2 className="text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p className="text-muted-foreground">
        If you have questions about our Cookies Policy, please contact us at support@nesternity.com.
      </p>
    </div>
  );
}
