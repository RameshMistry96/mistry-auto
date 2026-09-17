require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

// ================= EMAIL =================

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ================= MIDDLEWARE =================

app.use(cors());
app.use(express.json());

// ================= DATABASE =================

const dbPath = path.join(__dirname, 'mistry-auto.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to Mistry Auto database.');
  }
});

// Create appointments table automatically

db.run(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    vehicle TEXT NOT NULL,
    service TEXT NOT NULL,
    preferred_date TEXT NOT NULL,
    preferred_time TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ================= TEST ROUTE =================

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Mistry Auto backend is working!'
  });
});

// ================= CREATE APPOINTMENT =================

app.post('/api/appointments', (req, res) => {
  const {
    name,
    phone,
    email,
    vehicle,
    service,
    preferredDate,
    preferredTime,
    message
  } = req.body;

  // ================= VALIDATION =================

  if (
    !name ||
    !phone ||
    !email ||
    !vehicle ||
    !service ||
    !preferredDate ||
    !preferredTime
  ) {
    return res.status(400).json({
      success: false,
      message: 'Please complete all required fields.'
    });
  }

  // ================= SAVE APPOINTMENT =================

  const sql = `
    INSERT INTO appointments (
      name,
      phone,
      email,
      vehicle,
      service,
      preferred_date,
      preferred_time,
      message
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(
    sql,
    [
      name,
      phone,
      email,
      vehicle,
      service,
      preferredDate,
      preferredTime,
      message || ''
    ],
    function (err) {
      if (err) {
        console.error('Database error:', err.message);

        return res.status(500).json({
          success: false,
          message: 'Unable to save appointment.'
        });
      }

      const appointmentId = this.lastID;

      // ================= FORMAT DATE =================

      let formattedDate = preferredDate;

      try {
        const [year, month, day] = preferredDate.split('-');

        formattedDate = new Date(
          Number(year),
          Number(month) - 1,
          Number(day)
        ).toLocaleDateString('en-CA', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        formattedDate = preferredDate;
      }

      // ================= FORMAT TIME =================

      let formattedTime = preferredTime;

      try {
        const [hours, minutes] = preferredTime.split(':');

        const timeDate = new Date();

        timeDate.setHours(
          Number(hours),
          Number(minutes),
          0,
          0
        );

        formattedTime = timeDate.toLocaleTimeString('en-CA', {
          hour: 'numeric',
          minute: '2-digit'
        });
      } catch (error) {
        formattedTime = preferredTime;
      }

      // ================= EMAIL =================

      const mailOptions = {
        from: `"Mistry Auto Website" <${process.env.EMAIL_USER}>`,

        to: process.env.EMAIL_TO,

        replyTo: email,

        subject: `New Appointment #${appointmentId} - ${name} | ${service}`,

        // Plain text fallback
        text: `
NEW APPOINTMENT REQUEST

Mistry Auto Repair Center Inc.

Appointment #${appointmentId}

CUSTOMER
Name: ${name}
Phone: ${phone}
Email: ${email}

VEHICLE & SERVICE
Vehicle: ${vehicle}
Service: ${service}

PREFERRED APPOINTMENT
Date: ${formattedDate}
Time: ${formattedTime}

MESSAGE
${message || 'No additional message provided.'}

Status: PENDING

Submitted through the Mistry Auto Repair Center website.
        `,

        // ================= PREMIUM EMAIL TEMPLATE =================

        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Appointment Request</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #eef1f4;
  font-family: Arial, Helvetica, sans-serif;
">

  <table
    role="presentation"
    width="100%"
    cellspacing="0"
    cellpadding="0"
    border="0"
    style="background-color: #eef1f4;"
  >

    <tr>

      <td
        align="center"
        style="padding: 35px 15px;"
      >

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
          style="
            max-width: 680px;
            background-color: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0,0,0,0.08);
          "
        >

          <!-- ================= HEADER ================= -->

          <tr>

            <td
              align="center"
              style="
                background-color: #080a0c;
                padding: 32px 30px 28px;
                border-bottom: 4px solid #159ee4;
              "
            >

              <img
                src="cid:mistry-auto-logo"
                alt="Mistry Auto Repair Center Inc."
                width="190"
                style="
                  display: block;
                  width: 190px;
                  max-width: 100%;
                  height: auto;
                  margin: 0 auto 18px;
                "
              >

              <div style="
                color: #159ee4;
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 2.5px;
                text-transform: uppercase;
                margin-bottom: 8px;
              ">
                WEBSITE NOTIFICATION
              </div>

              <div style="
                color: #ffffff;
                font-size: 26px;
                line-height: 34px;
                font-weight: 800;
                letter-spacing: -0.5px;
              ">
                NEW APPOINTMENT REQUEST
              </div>

              <div style="
                color: #aab1b8;
                font-size: 14px;
                line-height: 22px;
                margin-top: 8px;
              ">
                A customer has requested automotive service.
              </div>

            </td>

          </tr>

          <!-- ================= APPOINTMENT STATUS ================= -->

          <tr>

            <td style="padding: 28px 30px 0;">

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background-color: #f5f9fc;
                  border: 1px solid #dceaf3;
                  border-radius: 10px;
                "
              >

                <tr>

                  <td style="padding: 20px 22px;">

                    <div style="
                      color: #6d7780;
                      font-size: 11px;
                      font-weight: 700;
                      letter-spacing: 1.5px;
                      margin-bottom: 6px;
                    ">
                      APPOINTMENT NUMBER
                    </div>

                    <div style="
                      color: #111820;
                      font-size: 23px;
                      font-weight: 800;
                    ">
                      #${appointmentId}
                    </div>

                  </td>

                  <td
                    align="right"
                    style="padding: 20px 22px;"
                  >

                    <span style="
                      display: inline-block;
                      background-color: #fff3cd;
                      color: #856404;
                      border: 1px solid #ffe69c;
                      padding: 8px 14px;
                      border-radius: 20px;
                      font-size: 11px;
                      font-weight: 800;
                      letter-spacing: 1px;
                    ">
                      ● PENDING
                    </span>

                  </td>

                </tr>

              </table>

            </td>

          </tr>

          <!-- ================= CUSTOMER ================= -->

          <tr>

            <td style="padding: 30px 30px 0;">

              <div style="
                color: #159ee4;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 2px;
                margin-bottom: 7px;
              ">
                CUSTOMER INFORMATION
              </div>

              <div style="
                color: #111820;
                font-size: 20px;
                font-weight: 800;
                margin-bottom: 17px;
              ">
                ${name}
              </div>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  border: 1px solid #e3e7eb;
                  border-radius: 10px;
                "
              >

                <tr>

                  <td
                    width="50%"
                    valign="top"
                    style="
                      padding: 18px 20px;
                      border-right: 1px solid #e3e7eb;
                    "
                  >

                    <div style="
                      color: #89929b;
                      font-size: 10px;
                      font-weight: 700;
                      letter-spacing: 1.3px;
                      margin-bottom: 7px;
                    ">
                      PHONE
                    </div>

                    <a
                      href="tel:${phone}"
                      style="
                        color: #111820;
                        font-size: 15px;
                        font-weight: 700;
                        text-decoration: none;
                      "
                    >
                      ${phone}
                    </a>

                  </td>

                  <td
                    width="50%"
                    valign="top"
                    style="padding: 18px 20px;"
                  >

                    <div style="
                      color: #89929b;
                      font-size: 10px;
                      font-weight: 700;
                      letter-spacing: 1.3px;
                      margin-bottom: 7px;
                    ">
                      EMAIL
                    </div>

                    <a
                      href="mailto:${email}"
                      style="
                        color: #159ee4;
                        font-size: 15px;
                        font-weight: 700;
                        text-decoration: none;
                        word-break: break-word;
                      "
                    >
                      ${email}
                    </a>

                  </td>

                </tr>

              </table>

            </td>

          </tr>

          <!-- ================= VEHICLE ================= -->

          <tr>

            <td style="padding: 30px 30px 0;">

              <div style="
                color: #159ee4;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 2px;
                margin-bottom: 15px;
              ">
                VEHICLE & SERVICE
              </div>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >

                <tr>

                  <td
                    width="50%"
                    valign="top"
                    style="
                      background-color: #0b0e11;
                      padding: 22px;
                      border-radius: 10px 0 0 10px;
                    "
                  >

                    <div style="
                      color: #7e8993;
                      font-size: 10px;
                      font-weight: 700;
                      letter-spacing: 1.3px;
                      margin-bottom: 8px;
                    ">
                      VEHICLE
                    </div>

                    <div style="
                      color: #ffffff;
                      font-size: 16px;
                      line-height: 23px;
                      font-weight: 700;
                    ">
                      ${vehicle}
                    </div>

                  </td>

                  <td
                    width="50%"
                    valign="top"
                    style="
                      background-color: #159ee4;
                      padding: 22px;
                      border-radius: 0 10px 10px 0;
                    "
                  >

                    <div style="
                      color: #dff4ff;
                      font-size: 10px;
                      font-weight: 700;
                      letter-spacing: 1.3px;
                      margin-bottom: 8px;
                    ">
                      REQUESTED SERVICE
                    </div>

                    <div style="
                      color: #ffffff;
                      font-size: 16px;
                      line-height: 23px;
                      font-weight: 800;
                    ">
                      ${service}
                    </div>

                  </td>

                </tr>

              </table>

            </td>

          </tr>

          <!-- ================= DATE & TIME ================= -->

          <tr>

            <td style="padding: 30px 30px 0;">

              <div style="
                color: #159ee4;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 2px;
                margin-bottom: 15px;
              ">
                PREFERRED APPOINTMENT
              </div>

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  background-color: #f7f8fa;
                  border: 1px solid #e3e7eb;
                  border-radius: 10px;
                "
              >

                <tr>

                  <td
                    width="50%"
                    valign="top"
                    style="
                      padding: 21px;
                      border-right: 1px solid #e3e7eb;
                    "
                  >

                    <div style="
                      color: #89929b;
                      font-size: 10px;
                      font-weight: 700;
                      letter-spacing: 1.3px;
                      margin-bottom: 7px;
                    ">
                      DATE
                    </div>

                    <div style="
                      color: #111820;
                      font-size: 16px;
                      line-height: 23px;
                      font-weight: 800;
                    ">
                      ${formattedDate}
                    </div>

                  </td>

                  <td
                    width="50%"
                    valign="top"
                    style="padding: 21px;"
                  >

                    <div style="
                      color: #89929b;
                      font-size: 10px;
                      font-weight: 700;
                      letter-spacing: 1.3px;
                      margin-bottom: 7px;
                    ">
                      TIME
                    </div>

                    <div style="
                      color: #111820;
                      font-size: 16px;
                      line-height: 23px;
                      font-weight: 800;
                    ">
                      ${formattedTime}
                    </div>

                  </td>

                </tr>

              </table>

            </td>

          </tr>

          <!-- ================= MESSAGE ================= -->

          <tr>

            <td style="padding: 30px;">

              <div style="
                color: #159ee4;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 2px;
                margin-bottom: 15px;
              ">
                CUSTOMER MESSAGE
              </div>

              <div style="
                background-color: #f7f8fa;
                border-left: 4px solid #159ee4;
                border-radius: 6px;
                padding: 18px 20px;
                color: #414950;
                font-size: 14px;
                line-height: 23px;
              ">
                ${message || 'No additional message provided.'}
              </div>

            </td>

          </tr>

          <!-- ================= ACTION BUTTONS ================= -->

          <tr>

            <td
              align="center"
              style="
                padding: 0 30px 35px;
              "
            >

              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
              >

                <tr>

                  <td
                    align="center"
                    style="
                      background-color: #159ee4;
                      border-radius: 6px;
                    "
                  >

                    <a
                      href="tel:${phone}"
                      style="
                        display: inline-block;
                        padding: 14px 22px;
                        color: #ffffff;
                        font-size: 12px;
                        font-weight: 800;
                        letter-spacing: 1px;
                        text-decoration: none;
                      "
                    >
                      CALL CUSTOMER
                    </a>

                  </td>

                  <td width="10"></td>

                  <td
                    align="center"
                    style="
                      background-color: #0b0e11;
                      border-radius: 6px;
                    "
                  >

                    <a
                      href="mailto:${email}"
                      style="
                        display: inline-block;
                        padding: 14px 22px;
                        color: #ffffff;
                        font-size: 12px;
                        font-weight: 800;
                        letter-spacing: 1px;
                        text-decoration: none;
                      "
                    >
                      REPLY BY EMAIL
                    </a>

                  </td>

                </tr>

              </table>

            </td>

          </tr>

          <!-- ================= FOOTER ================= -->

          <tr>

            <td
              align="center"
              style="
                background-color: #080a0c;
                padding: 26px 25px;
              "
            >

              <div style="
                color: #ffffff;
                font-size: 14px;
                font-weight: 800;
                margin-bottom: 8px;
              ">
                MISTRY AUTO REPAIR CENTER INC.
              </div>

              <div style="
                color: #8f989f;
                font-size: 12px;
                line-height: 20px;
              ">
                55 Selby Rd, Unit C4, Brampton, ON L6W 1K5
                <br>
                +1 (647) 533-8524
              </div>

              <div style="
                width: 35px;
                height: 3px;
                background-color: #159ee4;
                margin: 18px auto;
              "></div>

              <div style="
                color: #666f76;
                font-size: 10px;
                line-height: 17px;
              ">
                This notification was automatically generated
                from the Mistry Auto Repair Center website.
                <br>
                Appointment requests require confirmation.
              </div>

            </td>

          </tr>

        </table>

      </td>

    </tr>

  </table>

</body>
</html>
        `,

        // ================= EMBED LOGO =================

        attachments: [
          {
            filename: 'mistry-logo.png',
            path: path.join(
              __dirname,
              '..',
              'public',
              'images',
              'mistry-logo.png'
            ),
            cid: 'mistry-auto-logo'
          }
        ]
      };

      // ================= SEND EMAIL =================

      transporter.sendMail(mailOptions, (emailError, info) => {
        if (emailError) {
          console.error(
            'Appointment saved, but email failed:',
            emailError.message
          );

          return res.status(201).json({
            success: true,
            emailSent: false,
            message:
              'Appointment saved successfully, but email notification failed.',
            appointmentId: appointmentId
          });
        }

        console.log(
          'Appointment email sent:',
          info.messageId
        );

        return res.status(201).json({
          success: true,
          emailSent: true,
          message:
            'Appointment request received successfully.',
          appointmentId: appointmentId
        });
      });
    }
  );
});

// ================= GET APPOINTMENTS =================
// We will protect this later when we build Admin.

app.get('/api/appointments', (req, res) => {
  db.all(
    `SELECT * FROM appointments ORDER BY created_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Unable to load appointments.'
        });
      }

      res.json({
        success: true,
        appointments: rows
      });
    }
  );
});

// ================= START SERVER =================

app.listen(PORT, () => {
  console.log(
    `Mistry Auto server running on http://localhost:${PORT}`
  );
});