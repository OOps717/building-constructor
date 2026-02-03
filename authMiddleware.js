import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const auth = authHeader.authorization;

  if (!auth)
    return res.send(401).json({
      message: "Unauthorized. No token provided.",
    });
  const token = auth.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized. No token provided.",
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    res.sendStatus(401);
    return res.status(403).json({
      message: "Forbidden - Invalid or expired token",
    });
  }
}
