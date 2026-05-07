import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { emailId, phone, password } = await req.json();

    // 1. Validate input
    if ((!emailId && !phone) || !password) {
      return NextResponse.json(
        { error: "Email or phone and password are required." },
        { status: 400 }
      );
    }

    // 2. Search for user by email or phone
    const user = await prisma.customer.findFirst({
      where: emailId
        ? { emailId }
        : { phoneNo: phone },
    });

    // 3. User not found
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    // 4. Password check
    if (!user.password) {
      return NextResponse.json({ error: "Account error: no password set." }, { status: 500 });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    // 5. Success: return essential user info (including the role)
    return NextResponse.json({
      custId: user.custId,
      name: user.name,
      role: user.role, // This is what you'll use on the frontend to redirect
      emailId: user.emailId,
      phoneNo: user.phoneNo,
    });

  } catch (err) {
    // Add error logging for debugging (remove in production)
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}