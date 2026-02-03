import db from "../db.js";

class ProjectController {
  async logIn(req, res) {
    const { email, password } = req.body;

    // to change when login page will be ready
    if (email === "test@example.com" && password === "password123") {
      const payload = {
        userId: 1,
        email: "test@example.com",
        role: "user",
      };

      // Create the JWT token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        // expiresIn: "1h",
      });

      // Send the token back to the client
      res.json({
        message: "Login successful",
        token: token,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  }
}

export default ProjectController;
