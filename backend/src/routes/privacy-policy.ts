import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { App } from '../index.js';

export function registerPrivacyPolicyRoutes(app: App, fastify: FastifyInstance) {
  // Get privacy policy (no auth required)
  fastify.get(
    '/api/privacy-policy',
    {
      schema: {
        description: 'Get privacy policy',
        tags: ['legal'],
        response: {
          200: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              lastUpdated: { type: 'string' },
              sections: { type: 'array' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return {
        title: 'Privacy Policy',
        lastUpdated: '2024-01-01',
        content: `# THE ROSTER - Privacy Policy

## Last Updated: January 1, 2024

This Privacy Policy describes how THE ROSTER ("we," "us," "our," or "Company") collects, uses, shares, and protects your information when you use our mobile application and related services (collectively, the "Service").

## 1. Information We Collect

### 1.1 Information You Provide Directly
- **Account Information**: Name, email address, phone number, and profile photo when you create an account
- **Date Details**: Information about your dates, including the person's name, description of what they're wearing, location, and date/time
- **Safety Date Information**: Profile names, date destinations, emergency contact information (names and phone numbers), and GPS coordinates when you use our safety dating features
- **Notes**: Any notes or contextual information you choose to add
- **Photographs**: Profile images and any other photos you upload
- **Communications**: Messages, feedback, and other communications you send to us

### 1.2 Information Collected Automatically
- **Device Information**: Device type, operating system, unique device identifiers, and mobile network information
- **Usage Data**: Information about how you interact with the Service, including features used, dates created, profiles viewed, and time spent in the application
- **Location Information**: GPS coordinates and location data when you provide it during safety date setup; precise location only when you explicitly enable location services
- **Log Data**: Server logs, access times, pages viewed, and referring URLs
- **Cookies and Tracking Technologies**: We use cookies, web beacons, and similar technologies to track usage and preferences

## 2. How We Use Your Information

We use the information we collect for the following purposes:

### 2.1 Service Provision and Improvement
- Creating and maintaining your account
- Providing core features including roster management, date tracking, and safety date functionality
- Personalizing your experience and delivering tailored content
- Sending you technical notices and support messages
- Responding to your inquiries and providing customer service

### 2.2 Safety and Security
- Protecting against fraudulent, malicious, or unauthorized activity
- Detecting and preventing security incidents
- Enforcing our Terms of Service and other agreements
- Protecting the rights, privacy, safety, and property of THE ROSTER, our users, and the public

### 2.3 Analytics and Improvement
- Analyzing usage patterns to improve features and user experience
- Conducting research and analytics to understand user behavior
- Identifying trends and optimizing the Service
- A/B testing and feature development

### 2.4 Communications
- Sending you updates about your account and Service changes
- Sending promotional communications (with your consent)
- Responding to your requests and inquiries
- Notifying you about policy changes

### 2.5 Legal Compliance
- Complying with legal obligations, court orders, and government requests
- Establishing, exercising, or defending legal claims

## 3. Data Storage and Security

### 3.1 Data Storage
- Your information is stored on secure, encrypted servers
- We use industry-standard encryption (TLS/SSL) for data in transit
- Backups are maintained for disaster recovery purposes
- Data is retained as long as necessary to provide the Service and comply with legal obligations

### 3.2 Security Measures
- We implement comprehensive security measures including:
  - End-to-end encryption for sensitive communications
  - Multi-factor authentication options
  - Regular security audits and vulnerability assessments
  - Restricted access to personal information on a need-to-know basis
  - Employee confidentiality agreements
  - Secure deletion of data when no longer needed

### 3.3 Data Breach Notification
- In the event of a data breach affecting personal information, we will notify affected users without unreasonable delay
- Notifications will include information about the breach, affected data types, and recommended protective steps

## 4. Data Sharing and Disclosure

### 4.1 Information You Control
- **Emergency Contacts**: Information you share with emergency contacts during safety dates is disclosed at your explicit request
- **Date Sharing**: Profile photos and date details are only shared with emergency contacts you select
- **Public Profile**: Any information you choose to make public is accessible to other app users

### 4.2 Service Providers
- We share information with third-party service providers who assist with:
  - Cloud hosting and storage (Amazon Web Services, Google Cloud)
  - Analytics (Google Analytics, Mixpanel)
  - Customer support tools
  - Payment processing
- These providers are contractually obligated to maintain confidentiality and use data only as necessary to provide services

### 4.3 Legal Requirements
- We may disclose information when required by law, such as:
  - Subpoenas or court orders
  - Government investigations
  - Protecting against fraud or criminal activity
  - Protecting the safety of individuals

### 4.4 Business Transfers
- If THE ROSTER is involved in a merger, acquisition, bankruptcy, or asset sale, your information may be transferred as part of that transaction
- We will provide notice before your information becomes subject to a different privacy policy

### 4.5 Aggregated and De-identified Data
- We may share aggregated, anonymized data that cannot identify you with partners and the public
- This includes usage statistics, feature popularity, and demographic trends

## 5. Location Information

### 5.1 How We Use Location Data
- GPS coordinates provided during safety date setup are used to:
  - Display your date location on the safety screen
  - Provide location history in your date records
  - Enable emergency contact location sharing if you mark a date as emergency
  - Improve location-based features

### 5.2 Location Privacy
- Location information is only collected when you explicitly provide it
- You can disable location sharing at any time
- Precise location data is never sold to third parties
- Location history is retained as part of your safety date records

### 5.3 Location Sharing with Contacts
- When you share a safety date with emergency contacts, location information is included only if you provided it
- Contacts can view your location for the duration of the active safety date
- Location is automatically hidden when you mark the date as completed or emergency handled

## 6. Your Data Rights and Controls

### 6.1 Access and Portability
- You can access, review, and download your personal information at any time through your account settings
- You can request a copy of all your data in a portable format

### 6.2 Correction and Updates
- You can update your profile information directly in the app
- You can modify or delete photos and other uploaded content

### 6.3 Deletion
- You can delete individual safety dates and associated emergency contact records
- You can request complete account deletion, which will remove:
  - Your profile and account information
  - All safety dates and date records
  - Emergency contact information
  - Profile photos
- Account deletion is processed within 30 days
- Some information may be retained for legal or safety reasons

### 6.4 Marketing Communications
- You can opt out of promotional emails and push notifications at any time
- You can customize notification preferences in account settings
- Transactional and service-related messages cannot be disabled

### 6.5 Cookie Management
- You can control cookie settings through your device's browser or app settings
- Disabling cookies may limit some features

## 7. Third-Party Links

The Service may contain links to third-party websites and applications. This Privacy Policy does not apply to third-party services, and we are not responsible for their privacy practices. We encourage you to review their privacy policies before providing personal information.

## 8. Children's Privacy

THE ROSTER is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will take steps to delete such information promptly and terminate the child's account.

For users between 13 and 18 years of age:
- We provide enhanced privacy protections
- Emergency contact features have additional safeguards
- Location sharing is more restricted
- We recommend parental involvement in safety date features

If you believe a child under 13 has provided information to us, please contact us immediately at privacy@theroster.com.

## 9. International Data Transfers

Your information may be transferred to, stored in, and processed in countries other than your country of residence, which may have different privacy laws. By using THE ROSTER, you consent to the transfer of your information to countries outside your country of residence, which may not have equivalent data protection laws.

## 10. Data Retention

- **Active Account Data**: Retained while your account is active
- **Safety Dates**: Retained indefinitely for history and safety purposes
- **Account Deletion**: Data deleted within 30 days of request, except:
  - Information required for legal compliance
  - Safety date records related to emergency incidents
  - Aggregated, de-identified data
- **Marketing Data**: Retained until you opt out, then deleted within 30 days

## 11. Updates to This Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Material changes will be:
- Posted on our website and in the app
- Effective 30 days after posting (unless required by law to be effective immediately)
- Accompanied by prominent notice of the change

Your continued use of THE ROSTER after changes become effective constitutes your acceptance of the updated Privacy Policy.

## 12. Contact Us

If you have questions about this Privacy Policy or our privacy practices, please contact us at:

**THE ROSTER Privacy Team**
Email: privacy@theroster.com
Mailing Address: [Company Address]
Phone: [Company Phone]

We will respond to privacy inquiries within 10 business days.

## 13. Your Privacy Rights by Jurisdiction

### California Residents (CCPA/CPRA)
You have the right to:
- Know what personal information is collected, used, shared, or sold
- Delete personal information collected from you
- Opt-out of the sale or sharing of personal information
- Non-discrimination for exercising your rights

### European Union Residents (GDPR)
You have the right to:
- Access your personal data
- Rectify inaccurate data
- Request erasure ("right to be forgotten")
- Restrict processing
- Data portability
- Object to processing
- Lodge a complaint with your supervisory authority

### Other Jurisdictions
We comply with applicable privacy laws in your jurisdiction and provide similar rights where applicable.

---

**End of Privacy Policy**

THE ROSTER is committed to protecting your privacy while providing innovative dating safety features. We value your trust and are dedicated to transparent data practices.`,
        sections: [
          {
            title: 'Information Collection',
            subsections: [
              'Information You Provide Directly',
              'Information Collected Automatically',
            ],
          },
          {
            title: 'How We Use Your Information',
            subsections: [
              'Service Provision and Improvement',
              'Safety and Security',
              'Analytics and Improvement',
              'Communications',
              'Legal Compliance',
            ],
          },
          {
            title: 'Data Storage and Security',
            subsections: [
              'Data Storage',
              'Security Measures',
              'Data Breach Notification',
            ],
          },
          {
            title: 'Data Sharing and Disclosure',
            subsections: [
              'Information You Control',
              'Service Providers',
              'Legal Requirements',
              'Business Transfers',
              'Aggregated and De-identified Data',
            ],
          },
          {
            title: 'Location Information',
            subsections: [
              'How We Use Location Data',
              'Location Privacy',
              'Location Sharing with Contacts',
            ],
          },
          {
            title: 'Your Data Rights and Controls',
            subsections: [
              'Access and Portability',
              'Correction and Updates',
              'Deletion',
              'Marketing Communications',
              'Cookie Management',
            ],
          },
          {
            title: 'Children\'s Privacy',
            description: 'Information about privacy protections for users under 18',
          },
          {
            title: 'International Data Transfers',
            description: 'Information about cross-border data transfers',
          },
          {
            title: 'Updates to This Privacy Policy',
            description: 'How we notify users of policy changes',
          },
        ],
      };
    }
  );
}
