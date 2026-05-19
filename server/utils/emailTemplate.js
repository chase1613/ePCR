const logoSrc = 'https://ysslomavxzmynfyapfzp.supabase.co/storage/v1/object/public/assets/csc-final.png'

const emailTemplate = (name, otp) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0; padding:0; background:#f4f7fb; font-family: Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- ── Top banner with white background ── -->
          <tr>
            <td align="center" style="background: #ffffff; padding: 40px 32px 32px;">

              <!-- Logo on white rounded rectangle -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto 20px auto;">
                <tr>
                  <td align="center" valign="middle" style="
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 16px 24px;
                    box-shadow: 0 6px 24px rgba(0,0,0,0.25);
                  ">
                    <img
                      src="${logoSrc}"
                      alt="CSC Logo"
                      width="160"
                      height="120"
                      style="display: block; object-fit: contain;"
                    />
                  </td>
                </tr>
              </table>

              <!-- OTP dots decoration -->
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="
                    background: #E6F1FB;
                    border-radius: 20px;
                    padding: 8px 24px;
                    letter-spacing: 10px;
                    font-size: 18px;
                    color: #185FA5;
                  ">✦ ✦ ✦ ✦ ✦ ✦</td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding: 36px 40px 16px;">

              <!-- Title -->
              <h2 style="
                margin: 0 0 8px;
                font-size: 22px;
                font-weight: 700;
                color: #1a1a2e;
                text-align: center;
              ">Your one-time code is</h2>

              <!-- OTP Box -->
              <table cellpadding="0" cellspacing="0" style="margin: 20px auto;">
                <tr>
                  <td align="center" style="
                    border: 2px solid #0a2a6e;
                    border-radius: 10px;
                    padding: 16px 40px;
                    font-size: 36px;
                    font-weight: 800;
                    letter-spacing: 12px;
                    color: #0a2a6e;
                    background: #eef2ff;
                  ">${otp}</td>
                </tr>
              </table>

              <!-- Description -->
              <p style="
                margin: 0 0 6px;
                font-size: 13px;
                color: #555;
                text-align: center;
                line-height: 1.6;
              ">
                Hello <strong>${name}</strong>, please verify your identity by entering<br/>
                this 6-digit code when prompted. Just a heads up,<br/>
                this code will expire in <strong>10 minutes</strong> for security reasons.
              </p>

            </td>
          </tr>

          <!-- ── Warning ── -->
          <tr>
            <td style="padding: 8px 40px 24px;">
              <div style="
                background: #fff8e6;
                border-left: 4px solid #f0a500;
                border-radius: 6px;
                padding: 12px 16px;
                font-size: 12px;
                color: #7a5700;
              ">
                ⚠️ If you did not request this code, please ignore this email.
                Do not share this code with anyone.
              </div>
            </td>
          </tr>

          <!-- ── Divider ── -->
          <tr>
            <td style="padding: 0 40px;">
              <hr style="border: none; border-top: 1px solid #eee; margin: 0;"/>
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding: 20px 40px 32px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #aaa; line-height: 1.6;">
                <strong style="color: #0a2a6e;">Civil Service Commission</strong><br/>
                Regional Office VI · 7 Onate De Leon St, Mandurriao, Iloilo City <br/>
                Electronic Performance Commitment Review System
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`

module.exports = emailTemplate