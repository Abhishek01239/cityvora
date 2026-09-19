export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ ok: false, error: "Newsletter service is not configured." });
  }

  try {
    const contentType = req.headers["content-type"] || "";
    let email = "";

    if (contentType.includes("application/json")) {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      email = String(body.email || "").trim().toLowerCase();
    } else {
      email = String(req.body?.email || "").trim().toLowerCase();
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return res.status(400).json({ ok: false, error: "Please enter a valid email address." });
    }

    const headers = {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json"
    };

    // Add/update the subscriber in the Cityvora Newsletter list.
    const contactResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers,
      body: JSON.stringify({
        email,
        listIds: [2],
        updateEnabled: true
      })
    });

    if (!contactResponse.ok) {
      const details = await contactResponse.text();
      console.error("Brevo contact error:", details);
      return res.status(502).json({ ok: false, error: "Could not subscribe this email." });
    }

    // Send the automatic welcome email.
    const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers,
      body: JSON.stringify({
        sender: {
          name: "Cityvora",
          email: "gamerzdaminsion@gmail.com"
        },
        to: [{ email }],
        subject: "Welcome to Cityvora 🌆",
        textContent:
          "Welcome to Cityvora!\n\nThanks for joining the Cityvora newsletter. We'll send you useful city guides, places to explore, food finds, stays and local discoveries.\n\n— Cityvora",
        htmlContent: `<!doctype html>
<html>
  <body style="margin:0;background:#0b0f14;color:#e8f7fa;font-family:Arial,sans-serif">
    <div style="max-width:620px;margin:40px auto;padding:36px 28px;background:#111820;border:1px solid #26343c;border-radius:18px">
      <p style="margin:0 0 14px;color:#55e6ff;font-size:12px;letter-spacing:2px;font-weight:700">CITYVORA</p>
      <h1 style="margin:0 0 16px;font-size:32px;line-height:1.15">Welcome to Cityvora 🌆</h1>
      <p style="margin:0 0 16px;color:#b9c7cd;font-size:16px;line-height:1.7">Thanks for joining the Cityvora newsletter.</p>
      <p style="margin:0;color:#b9c7cd;font-size:16px;line-height:1.7">You'll get useful city guides, places to explore, food finds, stays and local discoveries.</p>
      <p style="margin:28px 0 0;color:#55e6ff;font-size:14px">— Cityvora</p>
    </div>
  </body>
</html>`
      })
    });

    if (!emailResponse.ok) {
      const details = await emailResponse.text();
      console.error("Brevo email error:", details);
      return res.status(502).json({
        ok: false,
        error: "You were added to the newsletter, but the welcome email could not be sent."
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Newsletter error:", error);
    return res.status(500).json({ ok: false, error: "Something went wrong. Please try again." });
  }
}
