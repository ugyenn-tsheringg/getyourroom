import { roomTypeLabel } from "./districts";
import type { Room } from "./types";

// Renders the daily saved-search alert email (sent via Resend). Email clients
// have poor CSS support, so this uses table-based layout + inline styles only.

// Square Cloudinary thumbnail (2x for retina), forced to JPG for email-client
// compatibility. Non-Cloudinary URLs are returned unchanged.
function thumb(url: string): string {
  return url.includes("/upload/")
    ? url.replace("/upload/", "/upload/c_fill,g_auto,w_224,h_224,q_auto,f_jpg/")
    : url;
}

// One listing as a bordered card: square photo (or placeholder) + details and a
// "View listing" button.
function roomCard(room: Room, siteUrl: string): string {
  const photo = room.images?.[0]
    ? `<img src="${thumb(room.images[0])}" width="112" height="112" alt="" style="display:block;width:112px;height:112px;border:0;" />`
    : `<table role="presentation" width="112" height="112" cellpadding="0" cellspacing="0" style="width:112px;height:112px;background-color:#f3f4f6;">
         <tr><td align="center" style="font-size:11px;color:#9ca3af;">No photo</td></tr>
       </table>`;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border:1px solid #ececec;border-radius:12px;overflow:hidden;">
      <tr>
        <td width="112" valign="top" style="width:112px;">${photo}</td>
        <td valign="top" style="padding:14px 16px;">
          <div style="font-size:15px;font-weight:600;color:#171717;line-height:1.3;">${roomTypeLabel(room.room_type)}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:3px;">${room.place}, ${room.district}</div>
          <div style="font-size:15px;font-weight:600;color:#171717;margin-top:8px;">Nu. ${room.price.toLocaleString("en-IN")} <span style="font-size:12px;font-weight:400;color:#9ca3af;">/ month</span></div>
          <a href="${siteUrl}/rooms/${room.id}" style="display:inline-block;margin-top:11px;background-color:#171717;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;padding:8px 16px;border-radius:8px;">View listing</a>
        </td>
      </tr>
    </table>`;
}

export function alertHtml(rooms: Room[], siteUrl: string): string {
  const many = rooms.length > 1;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;margin:0;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;background-color:#ffffff;border:1px solid #ececec;border-radius:14px;overflow:hidden;">
            <!-- Header -->
            <tr>
              <td style="padding:26px 32px;border-bottom:1px solid #f0f0f0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:10px;">
                      <img src="${siteUrl}/icon-192.png" width="34" height="34" alt="GetYourRoom" style="display:block;border-radius:8px;" />
                    </td>
                    <td style="font-size:17px;font-weight:600;color:#171717;letter-spacing:-0.01em;">GetYourRoom</td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Intro -->
            <tr>
              <td style="padding:30px 32px 10px;">
                <h1 style="margin:0;font-size:20px;line-height:1.3;font-weight:600;color:#171717;letter-spacing:-0.02em;">New room${many ? "s" : ""} matching your saved search</h1>
                <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#6b7280;">Here ${many ? "are" : "is"} ${rooms.length} new listing${many ? "s" : ""} that just went up matching what you're looking for.</p>
              </td>
            </tr>
            <!-- Listings -->
            <tr>
              <td style="padding:16px 32px 6px;">
                ${rooms.map((room) => roomCard(room, siteUrl)).join("")}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="padding:22px 32px 30px;border-top:1px solid #f0f0f0;">
                <p style="margin:0;font-size:13px;line-height:1.6;color:#9ca3af;">
                  You're receiving this because you saved a search on <span style="color:#171717;font-weight:600;">GetYourRoom</span>.<br />
                  <a href="${siteUrl}/saved-searches" style="color:#171717;text-decoration:underline;">Manage your saved searches</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}
