# ePCR App
A full-stack web application for the Civil Service Commission Region VI
Digitizing the 2026 Performance Commitment Review process for government employees.

Overview
ePCR is a secure, role-based web application built for the Civil Service Commission Region VI to streamline the electronic submission and management of Performance Commitment Reviews (PCR) for government employees.
The system replaces the traditional paper-based PCR process with a modern, efficient digital workflow — allowing employees to create and manage their performance commitments, while administrators oversee, analyze, and generate reports across the organization.

Features
👤 User Features

User Dashboard — personalized overview of performance commitments and status
Create PCR — guided multi-step form for submitting performance commitments across performance pillars
My PCR — complete list of all created PCRs with status tracking
Export PCR — generate and download individual PCRs in Excel and PDF format with one click
User Profile — view and update personal information and account settings
Forgot Password — secure 3-step OTP-based password reset via email

🛡️ Admin Features

Admin Dashboard — real-time analytics with stat cards and bar charts showing submission trends
Performance Reviews — collapsible grouped view of all employee PCRs across departments
User Management — create, update, activate, and deactivate employee accounts
Role-based Access Control — strict separation between admin and employee access; no self-registration

🔐 Security

JWT authentication with 8-hour token expiry
Account deactivation with modal feedback on login attempt
OTP email verification for password resets
Protected routes with middleware for both user and admin roles
Sentry integration for real-time error monitoring and session replay