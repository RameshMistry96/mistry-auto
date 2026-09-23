require('dotenv').config();

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

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
    archived INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error(
      'Appointments table error:',
      err.message
    );
    return;
  }

  // Add archived column to existing databases
  db.run(
    `ALTER TABLE appointments
     ADD COLUMN archived INTEGER DEFAULT 0`,
    (alterError) => {
      if (
        alterError &&
        !alterError.message.includes('duplicate column name')
      ) {
        console.error(
          'Archive column error:',
          alterError.message
        );
      }
    }
  );
});

// ================= BLOCKED DATES TABLE =================

db.run(`
  CREATE TABLE IF NOT EXISTS blocked_dates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blocked_date TEXT NOT NULL UNIQUE,
    reason TEXT DEFAULT 'Fully Booked',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error(
      'Blocked dates table error:',
      err.message
    );
  } else {
    console.log('Blocked dates table ready.');
  }
});

// ================= SERVICES TABLE =================

db.run(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price TEXT,
    image TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error(
      'Services table error:',
      err.message
    );
  } else {
    console.log('Services table ready.');
  }
});

// ================= DEFAULT SERVICES =================

db.get(`SELECT COUNT(*) AS total FROM services`, [], (err, row) => {
  if (err) {
    console.error('Service count error:', err.message);
    return;
  }

  if (row.total > 0) {
    return;
  }

  const defaultServices = [
    {
      name: 'Safety Inspection',
      description: 'Professional vehicle safety inspection and assessment.',
      price: '',
      image: '/images/services/safety.png'
    },
    {
      name: 'Oil Change',
      description: 'Routine oil and filter service to help protect your engine.',
      price: '',
      image: '/images/services/oil-change.png'
    },
    {
      name: 'Brake Job',
      description: 'Brake inspection, maintenance and repair services.',
      price: '',
      image: '/images/services/brake-job.png'
    },
    {
      name: 'Tune Up',
      description: 'Preventive maintenance to help keep your vehicle running smoothly.',
      price: '',
      image: '/images/services/tune-up.png'
    },
    {
      name: 'Suspension',
      description: 'Suspension inspection and repair for a smoother, safer ride.',
      price: '',
      image: '/images/services/suspension.png'
    },
    {
      name: 'Tire Service',
      description: 'Tire inspection, maintenance and related services.',
      price: '',
      image: '/images/services/tire-service.png'
    },
    {
      name: 'Exhaust Repair',
      description: 'Inspection and repair of exhaust system components.',
      price: '',
      image: '/images/services/exhaust-repair.png'
    },
    {
      name: 'Rust Proofing',
      description: 'Vehicle rust protection to help reduce corrosion.',
      price: '',
      image: '/images/services/rust-proofing.png'
    },
    {
      name: 'A/C & Heating',
      description: 'Heating and air conditioning diagnosis and repair.',
      price: '',
      image: '/images/services/ac-heating.png'
    },
    {
      name: 'Electrical Repair',
      description: 'Diagnosis and repair of common automotive electrical problems.',
      price: '',
      image: '/images/services/electrical-repair.png'
    }
  ];

  const sql = `
    INSERT INTO services (
      name,
      description,
      price,
      image
    )
    VALUES (?, ?, ?, ?)
  `;

  defaultServices.forEach((service) => {
    db.run(sql, [
      service.name,
      service.description,
      service.price,
      service.image
    ]);
  });

  console.log('Default services added.');
});

// ================= PUBLIC SERVICES API =================

app.get('/api/services', (req, res) => {
  db.all(
    `
      SELECT id, name, description, price, image
      FROM services
      WHERE active = 1
      ORDER BY id ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error('Services load error:', err.message);

        return res.status(500).json({
          success: false,
          message: 'Unable to load services.'
        });
      }

      return res.json({
        success: true,
        services: rows
      });
    }
  );
});

// ================= TEST ROUTE =================

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Mistry Auto backend is working!'
  });
});

// ================= GALLERY API =================

app.get('/api/gallery', (req, res) => {

  const galleryPath = path.join(
    __dirname,
    '..',
    'public',
    'gallery'
  );

  const categories = {
    GARAGE: 'garage',
    REPAIRS: 'repairs',
    CARS: 'cars',
    'BEFORE & AFTER': 'before-after',
    VIDEOS: 'videos'
  };

  const imageExtensions = [
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif'
  ];

  const videoExtensions = [
    '.mp4',
    '.webm',
    '.mov'
  ];

  const galleryItems = [];

  try {

    Object.entries(categories).forEach(
      ([category, folder]) => {

        const folderPath = path.join(
          galleryPath,
          folder
        );

        if (!fs.existsSync(folderPath)) {
          return;
        }

        const files = fs.readdirSync(folderPath);

        files.forEach((file) => {

          const extension =
            path.extname(file).toLowerCase();

          let type = null;

          if (imageExtensions.includes(extension)) {
            type = 'image';
          }

          if (videoExtensions.includes(extension)) {
            type = 'video';
          }

          if (!type) {
            return;
          }

          galleryItems.push({
            name: file,
            category,
            type,
            src: `/gallery/${folder}/${file}`
          });

        });

      }
    );

    res.json({
      success: true,
      items: galleryItems
    });

  } catch (error) {

    console.error(
      'Gallery error:',
      error
    );

    res.status(500).json({
      success: false,
      message: 'Unable to load gallery.'
    });

  }

});

// ================= ADMIN LOGIN =================

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password.'
    });
  }

  const token = jwt.sign(
    {
      username: process.env.ADMIN_USERNAME,
      role: 'admin'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '8h'
    }
  );

  return res.json({
    success: true,
    message: 'Login successful.',
    token
  });
});

// ================= PUBLIC BLOCKED DATES =================

// ================= PUBLIC BLOCKED DATES =================

app.get('/api/blocked-dates', (req, res) => {
  db.all(
    `
      SELECT blocked_date, reason
      FROM blocked_dates
      ORDER BY blocked_date ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error('Blocked dates error:', err.message);

        return res.status(500).json({
          success: false,
          message: 'Unable to load unavailable dates.'
        });
      }

      return res.json({
        success: true,
        blockedDates: rows.map((row) => ({
          date: row.blocked_date,
          reason: row.reason || 'Fully Booked'
        }))
      });
    }
  );
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

  // ================= DATE & TIME VALIDATION =================

const selectedDate = new Date(`${preferredDate}T12:00:00`);

if (Number.isNaN(selectedDate.getTime())) {
  return res.status(400).json({
    success: false,
    message: 'Please select a valid appointment date.'
  });
}

// Do not allow past dates
const today = new Date();
today.setHours(0, 0, 0, 0);

const appointmentDate = new Date(selectedDate);
appointmentDate.setHours(0, 0, 0, 0);

if (appointmentDate < today) {
  return res.status(400).json({
    success: false,
    message: 'Please select today or a future date.'
  });
}

// Sunday closed
if (selectedDate.getDay() === 0) {
  return res.status(400).json({
    success: false,
    message: 'We are closed on Sundays. Please select another date.'
  });
}

// Check business hours
const isSaturday = selectedDate.getDay() === 6;

const openingTime = '09:00';
const closingTime = isSaturday ? '15:00' : '18:30';

if (
  preferredTime < openingTime ||
  preferredTime > closingTime
) {
  return res.status(400).json({
    success: false,
    message: isSaturday
      ? 'Saturday appointments are available from 9:00 AM to 3:00 PM.'
      : 'Appointments are available from 9:00 AM to 6:30 PM.'
  });
}

// ================= CHECK BLOCKED DATE =================

db.get(
  `SELECT id, reason FROM blocked_dates WHERE blocked_date = ?`,
  [preferredDate],
  (blockedDateError, blockedDateRow) => {

    if (blockedDateError) {
      console.error(
        'Blocked date check error:',
        blockedDateError.message
      );

      return res.status(500).json({
        success: false,
        message: 'Unable to check appointment availability.'
      });
    }

if (blockedDateRow) {
  const reason = blockedDateRow.reason || 'Fully Booked';

  let message =
    'This date is unavailable for appointments. Please select another date.';

  if (reason === 'Fully Booked') {
    message =
      'We are fully booked on this date. Please select another available date.';
  }

  if (reason === 'Shop Closed') {
    message =
      'Our shop will be closed on this date. Please select another date.';
  }

  if (reason === 'Holiday') {
    message =
      'Our shop will be closed for a holiday on this date. Please select another date.';
  }

  return res.status(409).json({
    success: false,
    code: 'DATE_BLOCKED',
    reason,
    message
  });
}

    // ================= SAVE APPOINTMENT =================

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

  }
);
});


// ================= ADMIN SECURITY =================

const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Admin authorization required.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired admin session.'
    });
  }
};

// ================= ADMIN SERVICES API =================

// GET ALL SERVICES

app.get('/api/admin/services', requireAdmin, (req, res) => {
  db.all(
    `
      SELECT id, name, description, price, image, active
      FROM services
      ORDER BY id ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error('Admin services load error:', err.message);

        return res.status(500).json({
          success: false,
          message: 'Unable to load services.'
        });
      }

      return res.json({
        success: true,
        services: rows
      });
    }
  );
});

// UPDATE SERVICE

app.patch('/api/admin/services/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  const {
    name,
    description,
    price,
    active
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Service name is required.'
    });
  }

  const activeValue =
    active === false || active === 0 ? 0 : 1;

  db.run(
    `
      UPDATE services
      SET
        name = ?,
        description = ?,
        price = ?,
        active = ?
      WHERE id = ?
    `,
    [
      name.trim(),
      description || '',
      price || '',
      activeValue,
      id
    ],
    function (err) {
      if (err) {
        console.error(
          'Service update error:',
          err.message
        );

        return res.status(500).json({
          success: false,
          message: 'Unable to update service.'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found.'
        });
      }

      return res.json({
        success: true,
        message: 'Service updated successfully.'
      });
    }
  );
});

// ADD NEW SERVICE

app.post('/api/admin/services', requireAdmin, (req, res) => {
  const {
    name,
    description,
    price,
    image
  } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Service name is required.'
    });
  }

  db.run(
    `
      INSERT INTO services (
        name,
        description,
        price,
        image,
        active
      )
      VALUES (?, ?, ?, ?, 1)
    `,
    [
      name.trim(),
      description || '',
      price || '',
      image || ''
    ],
    function (err) {
      if (err) {
        console.error('Add service error:', err.message);

        return res.status(500).json({
          success: false,
          message: 'Unable to add service.'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Service added successfully.',
        id: this.lastID
      });
    }
  );
});

// DELETE SERVICE

app.delete('/api/admin/services/:id', requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run(
    `
      DELETE FROM services
      WHERE id = ?
    `,
    [id],
    function (err) {
      if (err) {
        console.error(
          'Delete service error:',
          err.message
        );

        return res.status(500).json({
          success: false,
          message: 'Unable to delete service.'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Service not found.'
        });
      }

      return res.json({
        success: true,
        message: 'Service deleted successfully.'
      });
    }
  );
});

// ================= BLOCKED DATES API =================

// GET BLOCKED DATES

app.get('/api/admin/blocked-dates', requireAdmin, (req, res) => {
  db.all(
    `
      SELECT blocked_date, reason
      FROM blocked_dates
      ORDER BY blocked_date ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error(err.message);

        return res.status(500).json({
          success: false,
          message: 'Unable to load blocked dates.'
        });
      }

      return res.json({
        success: true,
        blockedDates: rows
      });
    }
  );
});


// BLOCK DATE

app.post('/api/admin/blocked-dates', requireAdmin, (req, res) => {
  const { blockedDate, reason } = req.body;

  if (!blockedDate) {
    return res.status(400).json({
      success: false,
      message: 'Please select a date.'
    });
  }

  db.run(
    `
      INSERT INTO blocked_dates (
        blocked_date,
        reason
      )
      VALUES (?, ?)
    `,
    [
      blockedDate,
      reason || 'Fully Booked'
    ],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({
            success: false,
            message: 'This date is already blocked.'
          });
        }

        console.error(err.message);

        return res.status(500).json({
          success: false,
          message: 'Unable to block this date.'
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Date blocked successfully.',
        blockedDate: {
          id: this.lastID,
          blocked_date: blockedDate,
          reason: reason || 'Fully Booked'
        }
      });
    }
  );
});


// UNBLOCK DATE

app.delete(
  '/api/admin/blocked-dates/:id',
  requireAdmin,
  (req, res) => {
    db.run(
      `
        DELETE FROM blocked_dates
        WHERE id = ?
      `,
      [req.params.id],
      function (err) {
        if (err) {
          console.error(err.message);

          return res.status(500).json({
            success: false,
            message: 'Unable to unblock this date.'
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Blocked date not found.'
          });
        }

        return res.json({
          success: true,
          message: 'Date is available again.'
        });
      }
    );
  }
);


// ================= GET APPOINTMENTS =================

// ================= GET APPOINTMENTS =================

app.get('/api/appointments', requireAdmin, (req, res) => {
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

// ================= UPDATE APPOINTMENT STATUS =================

app.patch('/api/appointments/:id/status', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    'PENDING',
    'CONFIRMED',
    'COMPLETED',
    'CANCELLED'
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid appointment status.'
    });
  }

  // Get appointment first so we have customer information
  db.get(
    `SELECT * FROM appointments WHERE id = ?`,
    [id],
    (findError, appointment) => {
      if (findError) {
        console.error(
          'Appointment lookup error:',
          findError.message
        );

        return res.status(500).json({
          success: false,
          message: 'Unable to load appointment.'
        });
      }

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found.'
        });
      }

      const previousStatus = appointment.status;

      // Update appointment status
      db.run(
        `UPDATE appointments SET status = ? WHERE id = ?`,
        [status, id],
        function (updateError) {
          if (updateError) {
            console.error(
              'Appointment status update error:',
              updateError.message
            );

            return res.status(500).json({
              success: false,
              message: 'Unable to update appointment.'
            });
          }

          // ================= NO EMAIL NEEDED =================
          // Only CONFIRMED and CANCELLED send customer emails.

          if (
            status !== 'CONFIRMED' &&
            status !== 'CANCELLED'
          ) {
            return res.json({
              success: true,
              emailSent: false,
              message:
                'Appointment status updated successfully.'
            });
          }

          // Do not send the same status email again
          if (previousStatus === status) {
            return res.json({
              success: true,
              emailSent: false,
              message:
                'Appointment status is already up to date.'
            });
          }

          // ================= FORMAT DATE =================

          let formattedDate = appointment.preferred_date;

          try {
            const [year, month, day] =
              appointment.preferred_date.split('-');

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
            formattedDate = appointment.preferred_date;
          }

          // ================= FORMAT TIME =================

          let formattedTime = appointment.preferred_time;

          try {
            const [hours, minutes] =
              appointment.preferred_time.split(':');

            const timeDate = new Date();

            timeDate.setHours(
              Number(hours),
              Number(minutes),
              0,
              0
            );

            formattedTime = timeDate.toLocaleTimeString(
              'en-CA',
              {
                hour: 'numeric',
                minute: '2-digit'
              }
            );
          } catch (error) {
            formattedTime = appointment.preferred_time;
          }

          // ================= EMAIL DESIGN =================

          const isConfirmed = status === 'CONFIRMED';

          const emailTitle = isConfirmed
            ? 'APPOINTMENT CONFIRMED'
            : 'APPOINTMENT CANCELLED';

          const emailIntro = isConfirmed
            ? 'Your appointment with Mistry Auto Repair Center Inc. has been confirmed.'
            : 'Your appointment with Mistry Auto Repair Center Inc. has been cancelled.';

          const statusBackground = isConfirmed
            ? '#e4f7ea'
            : '#ffe8e8';

          const statusColor = isConfirmed
            ? '#237a3b'
            : '#b3261e';

          const statusBorder = isConfirmed
            ? '#bde7c8'
            : '#ffc6c6';

          const mailOptions = {
            from:
              `"Mistry Auto Repair Center" <${process.env.EMAIL_USER}>`,

            to: appointment.email,

            replyTo: process.env.EMAIL_TO,

            subject: isConfirmed
              ? `Appointment Confirmed #${appointment.id} - Mistry Auto Repair Center`
              : `Appointment Cancelled #${appointment.id} - Mistry Auto Repair Center`,

            // ================= TEXT FALLBACK =================

            text: `
${emailTitle}

Hi ${appointment.name},

${emailIntro}

APPOINTMENT #${appointment.id}

Vehicle: ${appointment.vehicle}
Service: ${appointment.service}
Date: ${formattedDate}
Time: ${formattedTime}

Mistry Auto Repair Center Inc.
55 Selby Rd, Unit C4
Brampton, ON L6W 1K5
+1 (647) 533-8524

If you have any questions, please contact our shop.
            `,

            // ================= PREMIUM CUSTOMER EMAIL =================

            html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${emailTitle}</title>
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
<td align="center" style="padding: 35px 15px;">

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

<!-- HEADER -->

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
  src="cid:mistry-auto-customer-logo"
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
  margin-bottom: 8px;
">
  MISTRY AUTO REPAIR CENTER
</div>

<div style="
  color: #ffffff;
  font-size: 27px;
  line-height: 35px;
  font-weight: 800;
">
  ${emailTitle}
</div>

</td>
</tr>


<!-- GREETING -->

<tr>
<td style="padding: 32px 30px 0;">

<div style="
  color: #111820;
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 10px;
">
  Hi ${appointment.name},
</div>

<div style="
  color: #626c74;
  font-size: 14px;
  line-height: 23px;
">
  ${emailIntro}
</div>

</td>
</tr>


<!-- STATUS -->

<tr>
<td style="padding: 25px 30px 0;">

<table
  role="presentation"
  width="100%"
  cellspacing="0"
  cellpadding="0"
  border="0"
  style="
    background-color: #f7f9fa;
    border: 1px solid #e2e7ea;
    border-radius: 10px;
  "
>

<tr>

<td style="padding: 20px 22px;">

<div style="
  color: #89929b;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.3px;
  margin-bottom: 6px;
">
  APPOINTMENT NUMBER
</div>

<div style="
  color: #111820;
  font-size: 22px;
  font-weight: 800;
">
  #${appointment.id}
</div>

</td>

<td
  align="right"
  style="padding: 20px 22px;"
>

<span style="
  display: inline-block;
  background-color: ${statusBackground};
  color: ${statusColor};
  border: 1px solid ${statusBorder};
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1px;
">
  ● ${status}
</span>

</td>

</tr>

</table>

</td>
</tr>


<!-- VEHICLE & SERVICE -->

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
  ${appointment.vehicle}
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
  SERVICE
</div>

<div style="
  color: #ffffff;
  font-size: 16px;
  line-height: 23px;
  font-weight: 800;
">
  ${appointment.service}
</div>

</td>

</tr>

</table>

</td>
</tr>


<!-- DATE & TIME -->

<tr>
<td style="padding: 30px;">

<div style="
  color: #159ee4;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: 15px;
">
  APPOINTMENT DETAILS
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


<!-- CONTACT -->

<tr>
<td
  align="center"
  style="padding: 0 30px 35px;"
>

<a
  href="tel:+16475338524"
  style="
    display: inline-block;
    background-color: #159ee4;
    color: #ffffff;
    padding: 14px 24px;
    border-radius: 6px;
    text-decoration: none;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1px;
  "
>
  CONTACT MISTRY AUTO
</a>

</td>
</tr>


<!-- FOOTER -->

<tr>
<td
  align="center"
  style="
    background-color: #080a0c;
    padding: 27px 25px;
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
  Thank you for choosing Mistry Auto Repair Center Inc.
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

            // ================= LOGO =================

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

                cid: 'mistry-auto-customer-logo'
              }
            ]
          };

            // ================= RESPOND IMMEDIATELY =================

            // Update Admin screen immediately
            res.json({
            success: true,
            emailQueued: true,
            message:
                status === 'CONFIRMED'
                ? 'Appointment confirmed successfully.'
                : 'Appointment cancelled successfully.'
            });

            // ================= SEND CUSTOMER EMAIL =================

            // Send email without making Admin wait
            transporter.sendMail(
            mailOptions,
            (emailError, info) => {
                if (emailError) {
                console.error(
                    `${status} saved, but customer email failed:`,
                    emailError.message
                );

                return;
                }

                console.log(
                `${status} customer email sent:`,
                info.messageId
                );
            }
            );
        }
      );
    }
  );
});

// ================= ARCHIVE / RESTORE APPOINTMENT =================

app.patch(
  '/api/appointments/:id/archive',
  requireAdmin,
  (req, res) => {
    const { id } = req.params;
    const { archived } = req.body;

    if (archived !== true && archived !== false) {
      return res.status(400).json({
        success: false,
        message: 'Archived value must be true or false.'
      });
    }

    const archiveValue = archived ? 1 : 0;

    db.run(
      `UPDATE appointments
       SET archived = ?
       WHERE id = ?`,
      [archiveValue, id],
      function (err) {
        if (err) {
          console.error(
            'Appointment archive error:',
            err.message
          );

          return res.status(500).json({
            success: false,
            message: 'Unable to update appointment archive.'
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            message: 'Appointment not found.'
          });
        }

        return res.json({
          success: true,
          archived: archived,
          message: archived
            ? 'Appointment archived successfully.'
            : 'Appointment restored successfully.'
        });
      }
    );
  }
);

// ================= START SERVER =================

app.listen(PORT, () => {
  console.log(
    `Mistry Auto server running on http://localhost:${PORT}`
  );
});