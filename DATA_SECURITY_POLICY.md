# Trellis AI Data Security and Privacy Policy
## For K-12 Educational Institutions

**Version:** 1.0  
**Last Updated:** September 2025  
**Classification:** Public

---

## Executive Summary

Trellis AI is committed to protecting the privacy and security of student and educator data. This comprehensive policy outlines our security architecture, data handling practices, and compliance measures specifically designed for K-12 educational institutions. We adhere to all applicable federal and state regulations including FERPA, COPPA, and state-specific student privacy laws.

## 1. Data Classification and Handling

### 1.1 Data Categories

**Category A - Highly Sensitive**
- Student personally identifiable information (PII)
- Teacher evaluation scores and performance data
- Authentication credentials
- Session tokens

**Category B - Sensitive**
- Observation notes and feedback
- Professional development goals
- School configuration data
- Aggregated performance metrics

**Category C - Internal**
- System logs (sanitized)
- Usage analytics (anonymized)
- Technical metadata

### 1.2 Data Minimization Principles
- We collect only the minimum data necessary for educational purposes
- No student data is collected beyond what is required for teacher evaluation context
- Automatic data retention limits ensure data is not kept longer than necessary
- Regular data audits identify and remove unnecessary information

## 2. Security Architecture

### 2.1 Infrastructure Security

**Database Security (PostgreSQL via Supabase)**
- AES-256 encryption at rest for all database storage
- TLS 1.3 encryption for all data in transit
- Row-level security (RLS) policies enforcing school-based data isolation
- Automated daily backups with point-in-time recovery capability
- Geographic redundancy across multiple availability zones

**Application Security**
- Next.js 15 with built-in security features
- Server-side rendering preventing client-side data exposure
- Strict Content Security Policy (CSP) headers
- HTTPS-only communication enforced
- Security headers including X-Frame-Options, X-Content-Type-Options

### 2.2 Authentication and Authorization

**Multi-Layer Authentication**
- Supabase Auth with enterprise-grade security
- Support for Single Sign-On (SSO) integration
- Multi-factor authentication (MFA) available
- Session management with automatic timeout
- Secure httpOnly cookies with SameSite protection

**Role-Based Access Control (RBAC)**
- Three-tier permission system: ADMIN, EVALUATOR, DISTRICT_ADMIN
- School-level data isolation (multi-tenancy)
- Granular permissions for sensitive operations
- Audit logging of all administrative actions

### 2.3 API Security

**Request Protection**
- Rate limiting per IP address (60 requests/minute)
- Input validation using Zod schemas
- SQL injection prevention via Prisma ORM
- XSS protection through automatic output encoding
- CSRF protection via SameSite cookies

**Data Validation**
- Strict type checking on all inputs
- Schema validation before database operations
- Sanitization of user-generated content
- File upload restrictions and virus scanning

## 3. Data Privacy Measures

### 3.1 Data Encryption

**Encryption Standards**
- AES-256-GCM for data at rest
- TLS 1.3 for data in transit
- Encrypted storage for uploaded files
- Secure key management via environment variables

### 3.2 Data Anonymization

**AI Processing**
- Minimal context sent to AI providers
- PII stripped before AI processing
- No training on customer data
- Temporary processing only, no retention

### 3.3 Access Controls

**Principle of Least Privilege**
- Users access only their school's data
- Time-limited signed URLs for file access
- Automatic session expiration
- IP-based access restrictions available

## 4. Third-Party Data Processing

### 4.1 Sub-Processors

| Provider | Purpose | Data Shared | Security Measures |
|----------|---------|-------------|-------------------|
| Supabase | Database & Auth | User profiles, encrypted data | SOC 2 Type II, GDPR compliant |
| Anthropic | AI Enhancement | Sanitized observation notes | No training on data, DPA available |
| OpenAI | AI Enhancement | Sanitized observation notes | Enterprise agreement, DPA available |
| Vercel | Hosting | Application traffic | SOC 2, PCI DSS compliant |

### 4.2 Data Processing Agreements
- Executed DPAs with all sub-processors
- Standard Contractual Clauses (SCCs) where applicable
- Annual security review of all vendors
- Immediate notification of vendor changes

## 5. Compliance and Certifications

### 5.1 Regulatory Compliance

**FERPA (Family Educational Rights and Privacy Act)**
- School official exception compliance
- Limited data access to authorized personnel
- Parent/guardian access rights supported
- No unauthorized disclosure of education records

**COPPA (Children's Online Privacy Protection Act)**
- No direct collection from students under 13
- School consent serves as parental consent
- Transparent data practices
- Right to review and delete data

**State Privacy Laws**
- California AB 1584 / SOPIPA compliance
- New York Education Law 2-d compliance
- Customizable to meet state-specific requirements

### 5.2 Industry Standards
- NIST Cybersecurity Framework aligned
- ISO 27001 principles incorporated
- OWASP Top 10 protections implemented
- CIS Controls framework adoption

## 6. Data Retention and Deletion

### 6.1 Retention Schedules

| Data Type | Retention Period | Deletion Method |
|-----------|-----------------|-----------------|
| Active teacher profiles | Duration of employment + 1 year | Secure wipe |
| Observation data | Academic year + 3 years | Permanent deletion |
| Evaluation records | 7 years (or per state law) | Cryptographic erasure |
| System logs | 90 days | Automatic rotation |
| Backup data | 30 days | Automatic expiration |

### 6.2 Data Deletion Rights
- Immediate deletion upon written request
- Cascade deletion of related records
- Confirmation of deletion provided
- Backup purging within 30 days

## 7. Security Monitoring and Incident Response

### 7.1 Continuous Monitoring

**Real-Time Security Monitoring**
- 24/7 automated threat detection
- Anomaly detection for unusual access patterns
- Failed authentication tracking
- Rate limit violation monitoring

**Security Auditing**
- Comprehensive audit logs for all data access
- Administrative action logging
- Regular security assessments
- Penetration testing annually

### 7.2 Incident Response Plan

**Response Timeline**
1. **Detection** - Automated alerts within minutes
2. **Assessment** - Initial assessment within 1 hour
3. **Containment** - Immediate isolation of affected systems
4. **Notification** - Customer notification within 72 hours
5. **Remediation** - Full remediation and root cause analysis
6. **Review** - Post-incident review and improvement

**Breach Notification**
- Notification within 72 hours of discovery
- Detailed incident report provided
- Assistance with regulatory notifications
- Credit monitoring offered if applicable

## 8. Physical and Environmental Security

### 8.1 Data Center Security
- SOC 2 Type II certified facilities
- 24/7 physical security monitoring
- Biometric access controls
- Environmental controls (fire, flood, temperature)
- Redundant power and network connectivity

### 8.2 Disaster Recovery
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour
- Geographically distributed backups
- Tested disaster recovery procedures
- Business continuity planning

## 9. Employee Security

### 9.1 Personnel Security
- Background checks for all employees
- Confidentiality agreements required
- Security training mandatory
- Principle of least privilege for access
- Immediate access revocation upon termination

### 9.2 Security Awareness
- Annual security training required
- Phishing simulation exercises
- Security best practices documentation
- Incident reporting procedures

## 10. Data Subject Rights

### 10.1 Rights Guaranteed
- **Right to Access** - View all collected data
- **Right to Rectification** - Correct inaccurate data
- **Right to Deletion** - Request data removal
- **Right to Portability** - Export data in standard format
- **Right to Restriction** - Limit data processing
- **Right to Object** - Opt-out of certain processing

### 10.2 Exercising Rights
- Written requests to: privacy@trellis.ai
- Identity verification required
- Response within 30 days
- No fee for reasonable requests
- Appeals process available

## 11. Security Controls Checklist

### 11.1 Technical Controls
- ✅ Encryption at rest (AES-256)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Multi-factor authentication
- ✅ Role-based access control
- ✅ API rate limiting
- ✅ Input validation
- ✅ Output encoding
- ✅ Security headers
- ✅ Automated backups
- ✅ Audit logging

### 11.2 Administrative Controls
- ✅ Security policies documented
- ✅ Incident response plan
- ✅ Employee training program
- ✅ Vendor management process
- ✅ Risk assessments
- ✅ Compliance monitoring
- ✅ Data classification
- ✅ Access reviews

### 11.3 Physical Controls
- ✅ Secure data centers
- ✅ Environmental monitoring
- ✅ Access controls
- ✅ Video surveillance
- ✅ Redundant systems

## 12. Contact Information

**Data Protection Officer**  
Email: privacy@trellis.ai  
Phone: 1-800-TRELLIS  

**Security Team**  
Email: security@trellis.ai  
Security Incident Hotline: 1-800-SECURE1  

**Compliance Inquiries**  
Email: compliance@trellis.ai  

## 13. Policy Updates

This policy is reviewed quarterly and updated as needed to reflect:
- Changes in applicable laws and regulations
- Improvements to our security posture
- Feedback from educational partners
- Industry best practices evolution

**Change Log**
- Version 1.0 - Initial policy publication (September 2025)

---

## Appendix A: FERPA Compliance Details

### School Official Designation
Trellis AI operates under the "school official" exception to FERPA's consent requirement. We:
- Perform institutional services that would otherwise be performed by school employees
- Are under direct control of the school regarding education records
- Use education records only for authorized purposes
- Do not re-disclose PII without consent

### Directory Information
We do not collect or process FERPA directory information unless specifically authorized by the school and with appropriate opt-out mechanisms in place.

## Appendix B: State-Specific Requirements

### California (SOPIPA/AB 1584)
- No targeted advertising based on student data
- No profile building except for educational purposes
- No sale of student information
- Deletion of data upon contract termination

### New York (Education Law 2-d)
- Parent Bill of Rights compliance
- Data Security and Privacy Plan filed
- Annual security training certification
- Chief Privacy Officer designation

### Texas (SB 820)
- Cybersecurity training for personnel
- Multi-factor authentication required
- Vulnerability disclosure program
- Annual security assessment

## Appendix C: Technical Security Specifications

### Cryptographic Standards
- Encryption: AES-256-GCM
- Hashing: Argon2id for passwords
- Key Derivation: PBKDF2 with 100,000 iterations
- Random Generation: Cryptographically secure (CSPRNG)
- Certificate: SHA-256 with RSA 2048-bit minimum

### Network Security
- Firewall: Web Application Firewall (WAF) enabled
- DDoS Protection: CloudFlare or equivalent
- DNS Security: DNSSEC enabled
- Network Segmentation: Isolated production environment

---

*This document represents our commitment to protecting educational data. For questions or concerns, please contact our Data Protection Officer at privacy@trellis.ai*