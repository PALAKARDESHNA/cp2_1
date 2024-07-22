const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const path = require("path");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const dummyData = require('./public/javascripts/dummydata');
const hackathons = require('./public/javascripts/hackathonData');


const app = express();
const otps = {};
const port = process.env.PORT || 3000;

const session = require("express-session");
const { Script } = require("vm");
const hackathonData = require("./public/javascripts/hackathonData");
// const hackathonData = require("./public/javascripts/hackathonData");

app.use(
  session({
    secret: "your secret key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // set to true if your using https
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For JSON payloads
app.use(express.static(__dirname)); // Serve static files
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Create a MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "createaccount",
  port: "3307", // Change the port as needed
});

// Create the 'accounts' table for account registration
db.connect((err) => {
  if (err) {
    console.log("MySQL connection failed: " + err.message);
  } else {
    console.log("Connected to MySQL");
  }
});

app.get("/", (req, res) => {
  // res.render("Landing");
  res.render('landing', { isAuthenticated: req.session.user ? true : false });
});

// app.get('/landing',(req,res)=>{
//   res.render('Landing');
// })

// app.get('/signin', (req, res) => {
//   res.render('login');
// });

app.get("/signin", (req, res) => {
  res.render("login");
});
app.get("/signup", (req, res) => {
  res.render("register");
});

app.get("/forgot-password", (req, res) => {
  res.render("forgotpass");
});

// app.get("/dashboard", (req, res) => {
//   res.render("dashboard", { name: req.session.name, dummyData, hackathons });
// });





// app.use(bodyParser.urlencoded({ extended: true }));
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));
// app.use(express.static(__dirname));

app.get("/newPass", (req, res) => {
  res.render("newpass");
});

app.get('/events', (req, res) => {
  res.render('events',{dummyData});
});

app.get('/hackathons', (req, res) => {
  res.render('hackathon', { hackathons });
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    // handle case where no user is logged in
    res.redirect("/signin");
  } else {
    // res.render("dashboard", { user: req.session.user });
    const user = req.session.user;
    res.render("dashboard", { accounts: user, dummyData, hackathons });
  }
});

// function redirectIfAuthenticated(req, res, next) {
//   if (req.session.user) {
//       res.redirect('/dashboard');
//   } else {
//       next();
//   }
// }
// function redirectIfNotAuthenticated(req, res, next) {
//   if (!req.session.user) {
//     res.redirect('/signin');
//   } else {
//     next();
//   }
// }

// app.get("/dashboard", redirectIfNotAuthenticated, (req, res) => {
//   res.render("dashboard", { accounts: req.session.user, dummyData, hackathons });
// });

// function redirectIfAuthenticated(req, res, next) {
//   if (req.session.user) {
//     res.redirect('/dashboard');
//   } else {
//     next();
//   }
// }

// ---------------------------------REGISTER--------------------------------
app.post("/register", (req, res) => {
  console.log("req.body:", req.body);
  // rest of your code...
});

// ---------------------------------REGISTER--------------------------------
app.post("/register" ,(req, res) => {
  console.log("req.body:", req.body);
  const { name, email, phonenumber, dob, gender, password } = req.body;

  const sql =
    "INSERT INTO accounts (name, email, phonenumber, dob, gender, password) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [name, email, phonenumber, dob, gender, password],
    (err, result) => {
      if (err) {
        console.error("MySQL query error: " + err.message);
        res.send("Registration failed. Please try again.");
      } else {
        // res.send('Registration successful. You can now log in.');
        // res.render('login');
        res.redirect("/signin");
      }
    }
  );
});

// ---------------------------------LOGIN--------------------------------

app.post("/login", (req, res) => {
  const identifier = req.body.identifier; // Retrieve the user identifier from the session
  const password = req.body.password; // Retrieve the password from the session

  // const { identifier, password } = req.body;
  const isEmail = isValidEmail(identifier);
  const isMobile = isValidMobileNumber(identifier);

  console.log("identifier: " + identifier);
  console.log("password: " + password);
  console.log("isEmail: " + isEmail);
  if (isEmail || isMobile) {
    let sql, identifierType;

    if (isEmail) {
      sql = "SELECT * FROM accounts WHERE email = ? AND password = ?";
      identifierType = "email";
    } else {
      sql = "SELECT * FROM accounts WHERE phonenumber = ? AND password = ?";
      identifierType = "phone number";
    }

    db.query(sql, [identifier, password], (err, result) => {
      if (err) {
        console.log("MySQL query error: " + err.message);
        res.send("Login failed. Please try again.");
        // res.send('Failed to fetch user information.');
      } else {
        if (result.length >0) {
          // const user = result[0];
          // res.render('dashboard', { name: user.name });
          // res.redirect('/dashboard',{ name: user.name });
          // req.session.name = user.name;
          // res.redirect("/dashboard");

          req.session.user = result[0]; // store user data in session
          res.redirect('/dashboard');
        } else {
          res.send(`User with ${identifierType} not found.`);
        }
      }
    });
  } else {
    res.send("Invalid input. Please enter either an email or phone number.");
  }
});

function isValidEmail(input) {
  // Regular expression for validating an email address
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return emailRegex.test(input);
}

function isValidMobileNumber(input) {
  // Regular expression for validating a mobile number (10 digits)
  const mobileRegex = /^\d{10}$/;
  return mobileRegex.test(input);
}

// -------------------LOGOUT--------------------------
app.get('/logout', function(req, res){
   req.session.destroy(function(err){
      if(err){
         console.log(err);
      } else {
         res.redirect('/');
      }
   });
});

// -------------------SEND OTP CODE--------------------------

// Nodemailer configuration
// const transporter = nodemailer.createTransport({
//   service: 'Gmail', // Change to your email service provider
//   auth: {
//     user: 'gurupatel21@gnu.ac.in', // Replace with your email
//     pass: 'Ethicalhacker*@007', // Replace with your email password
//   },
//   secure: true,
// });
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: "code.guru@outlook.in",
    pass: "Ethicalhacker*@007",
  },
});

// Example: Using environment variables for Twilio credentials
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;

// Middleware

app.post("/send-otp", (req, res) => {
  const identifier = req.body.identifier;

  if (isValidEmail(identifier)) {
    // It's an email, perform email-related logic
    const sql = "SELECT * FROM accounts WHERE email = ?";
    db.query(sql, [identifier], (err, rows) => {
      if (err) {
        console.error(err);
        res.send("An error occurred while checking the email.");
      } else if (rows.length > 0) {
        const otp = generateNumericOTP(6);
        otps[identifier] = {
          otp,
          createdAt: Date.now(),
        };
        const mailOptions = {
          from: "code.guru@outlook.in",
          to: identifier,
          subject: "Your OTP for Email Verification",
          text: `Your OTP is: ${otp}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error(error);
            res.send("Failed to send OTP. Please try again.");
          } else {
            console.log(`Email sent: ${info.response}`);
            res.render("otp", { identifier, storedOTP: otp });
          }
        });
      } else {
        res.send("No such email found in the database. Please sign up.");
      }
    });
  } else if (isValidMobileNumber(identifier)) {
    // It's a mobile number, perform mobile-related logic
    const sql = "SELECT * FROM accounts WHERE phonenumber = ?";
    db.query(sql, [identifier], (err, rows) => {
      if (err) {
        console.error(err);
        res.send("An error occurred while checking the phone number.");
      } else if (rows.length > 0) {
        const otp = generateNumericOTP(6);
        otps[identifier] = {
          otp,
          createdAt: Date.now(),
        };
        // You would use your SMS gateway provider's API here to send the OTP via SMS
        // Replace the placeholder code below with your actual SMS sending logic.
        sendSMSOTP("+91" + identifier, otp, (smsError, smsResponse) => {
          if (smsError) {
            console.error(smsError);
            res.send("Failed to send SMS OTP. Please try again.");
          } else {
            console.log("SMS sent:", smsResponse);
            // res.render('otp', { identifier, storedOTP: otp });
          }
        });
      } else {
        res.send("No such phone number found in the database. Please sign up.");
      }
    });
  } else {
    res.send("Invalid input. Please enter either an email or mobile number.");
  }

  function generateNumericOTP(length) {
    const chars = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      otp += chars.charAt(randomIndex);
    }
    return otp;
  }

  function sendSMSOTP(mobile, otp, callback) {
    if (!mobile.startsWith("+")) {
      mobile = "+91" + mobile; // Assuming the number is an Indian number
    }

    // Implement your SMS gateway provider's API to send the OTP via SMS here
    // You can use Twilio, Nexmo, or any other SMS gateway provider.
    // Replace the following placeholder code with the actual implementation.
    // Example placeholder code:
    const accountSid = "AC24848a8592f93068fc9c8c93e1244e3c";
    const authToken = "fe6b923075bafc596005482108c58c86";
    const client = new twilio(accountSid, authToken);
    // const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    client.messages
      .create({
        body: `Your OTP is: ${otp}`,
        from: "+12563635932",
        to: mobile,
      })
      .then((message) => {
        console.log("Message sent. SID: " + message.sid);
        res.render("otp", { identifier, storedOTP: otp });
      })
      .catch((error) => {
        console.error("Error sending message: " + error.message);
      });
  }
});

// ---------------------------VERIFY OTP--------------------------

// Import necessary modules and setup the app

// Handle the POST request for OTP verification
app.post("/verify-otp", (req, res) => {
  const identifier = req.body.identifier;
  const userOTP = req.body.otp;
  const storedOTP = req.body.storedOTP;

  if (otpIsValid(identifier, userOTP)) {
    // OTP verification successful
    res.render("newpass", { identifier }); // Redirect to password reset page
  } else {
    console.log("Invalid OTP or expired. Please try again.");
    res.send("Invalid OTP or expired. Please try again.");
  }
});

// Function to verify OTP

const otpValidityDuration = 2 * 60 * 1000; // 2 minutes in milliseconds

function otpIsValid(identifier, userOTP) {
  const storedOTP = otps[identifier];
  if (!storedOTP) {
    console.log("OTP not found");
    return false; // OTP not found
  }

  const currentTime = Date.now();
  const elapsedTime = currentTime - storedOTP.createdAt;

  if (elapsedTime <= otpValidityDuration && storedOTP.otp === userOTP) {
    console.log("OTP is valid");
    delete otps[identifier]; // Remove the used OTP
    return true;
  } else {
    console.log("OTP is invalid or expired");
    return false;
  }
}

// ---------------------------------RESET PASSWORD---------------------------

// Handle the POST request to update the password after OTP verification
app.post("/update-password", (req, res) => {
  const identifier = req.body.identifier;
  const newPassword = req.body.newPassword;
  const confirmPassword = req.body.confirmPassword;

  if (newPassword !== confirmPassword) {
    res.send(
      "New password and confirmation password do not match. Please try again."
    );
  } else {
    // Implement your logic to update the password for the given identifier
    // For example, you can check whether 'identifier' is an email or phone number
    // Then, update the password in your database

    // After updating the password successfully, you can redirect the user to the login page
    // You should replace the code below with your database update logic
    // Sample code below:

    const isEmail = isValidEmail(identifier);
    const isMobile = isValidMobileNumber(identifier);

    if (isEmail || isMobile) {
      const sql = isEmail
        ? "UPDATE accounts SET password = ? WHERE email = ?"
        : "UPDATE accounts SET password = ? WHERE phonenumber = ?";

      const identifierType = isEmail ? "email" : "phone number";

      db.query(sql, [newPassword, identifier], (err, result) => {
        if (err) {
          console.log("MySQL query error: " + err.message);
          res.send(
            `Failed to update password for ${identifierType}. Please try again.`
          );
        } else {
          res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Password Updated Successfully</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Import font families */
        @font-face {
            font-family: 'GT Walsheim';
            src: url('path/to/GTWalsheim.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
        }
        @font-face {
            font-family: 'GT Walsheim';
            src: url('path/to/GTWalsheimBold.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
        }
    </style>
</head>
<body class="bg-[#faddc5] font-['GT Walsheim'] flex flex-col justify-center items-center min-h-screen">
    <h1 class="text-[3rem] text-[#3f4527] font-black uppercase mb-8">Password Updated Successfully for ${identifierType}</h1>
    <a href="/signin" class="btn bg-[#c4b94f] hover:bg-[#b0a644] text-[#3f4527] font-semibold px-8 py-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 uppercase text-[1.5rem]">Go to Login</a>
</body>
</html>

          `);
        }
      });
    } else {
      res.send("Invalid input. Please enter either an email or mobile number.");
    }
  }
});

// particular Event details
app.get('/event/:id', (req, res) => {
  const eventId = req.params.id;
  console.log(eventId);
  const eventDetails = dummyData.find(event => event.moreDetails.eventid === eventId);

  if (!eventDetails) {
    return res.status(404).send('Event not found');
  }

  // Get three random related events
  const relatedEvents = dummyData.filter(event => event.moreDetails.eventid !== eventId).sort(() => 0.5 - Math.random()).slice(0, 3);

  res.render('eventDetails', { eventDetails, relatedEvents });
});

app.get('/hackathon/:id', (req, res) => {
  const hackathonId = req.params.id;
  const hackathonDetails = hackathons.find(hackathon => hackathon.moreDetails.eventid === hackathonId);
  if (!hackathonDetails) {
      res.status(404).send('Hackathon not found');
      return;
  }

  // For simplicity, assume related hackathons are the first 3 hackathons in the list
  // const relatedHackathons = hackathons.slice(0, 3);
  const relatedHackathons = hackathonData.filter(hackathon => hackathon.moreDetails.eventid !== hackathonId).sort(() => 0.5 - Math.random()).slice(0, 3)

  res.render('hackathonDetails', { hackathonDetails, relatedHackathons });
});

// --------------------------------------- update USER DETAILS ---------------------------------

app.post('/updateDetails', (req, res) => {
  const { name, email, phone, dob, gender } = req.body;

  // Assuming the user is identified by email or phone number
  const userEmail = req.body.email;
  const userPhone = req.body.phone;

  const query = `UPDATE accounts SET name = ?,email= ?,phonenumber=?, dob = ?, gender = ? WHERE email = ? OR phonenumber = ?`;

  db.query(query, [name,email,phone, dob, gender, userEmail, userPhone], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('An error occurred while updating the user details.');
    } else {
      // Re-fetch the user from the database after updating
      db.query(`SELECT * FROM accounts WHERE email = ? OR phonenumber = ?`, [userEmail, userPhone], (err, results) => {
        if (err) {
          console.error(err);
          res.status(500).send('An error occurred while fetching the updated user details.');
        } else {
          const updatedUser = results[0];
          req.session.user = updatedUser;
          // Render the dashboard page with the updated user
          // res.render('dashboard', { accounts: updatedUser });
          res.redirect('/dashboard');
        }
      });
    }
  });
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
