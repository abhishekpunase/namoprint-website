import { LegalPage } from '../models/LegalPage.js';

export const LEGAL_PAGE_SLUGS = [
  'privacy-policy',
  'terms-and-conditions',
  'refund-policy',
  'shipping-policy',
];

export const DEFAULT_LEGAL_PAGES = [
  {
    slug: 'privacy-policy',
    title: 'Privacy',
    titleAccent: 'Policy',
    updatedLabel: 'Last updated: July 14, 2026',
    intro:
      'At Namo Prints, your trust matters to us. This page outlines how we collect, use, and safeguard your personal information whenever you use our website or services.',
    sections: [
      {
        title: '1. Introduction',
        content:
          'Namo Prints ("we", "us", "our") respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, store, and protect your information when you visit our website or place an order with us.',
      },
      {
        title: '2. Information We Collect',
        content:
          'We may collect personal details such as your name, email address, phone number, shipping address, and payment information when you create an account, place an order, or contact us. We also collect non-personal information such as browser type, device information, and usage data to improve our services.',
      },
      {
        title: '3. How We Use Your Information',
        content:
          'We use the information we collect to process orders, provide customer support, personalize your shopping experience, send order updates and promotional offers (only if you opt in), and improve our website and services.',
      },
      {
        title: '4. Sharing Your Information',
        content:
          'We do not sell or rent your personal information to third parties. We may share your information with trusted service providers such as payment gateways, shipping partners, and analytics providers, solely for the purpose of fulfilling your order and improving our services.',
      },
      {
        title: '5. Cookies',
        content:
          'Our website uses cookies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can choose to disable cookies through your browser settings, though this may affect certain features of the website.',
      },
      {
        title: '6. Data Security',
        content:
          'We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.',
      },
      {
        title: '7. Your Rights',
        content:
          'You have the right to access, update, or delete your personal information at any time. You may also opt out of receiving promotional communications from us by using the unsubscribe link or contacting us directly.',
      },
      {
        title: '8. Third-Party Links',
        content:
          'Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of those websites. We encourage you to review the privacy policies of any third-party sites you visit.',
      },
      {
        title: '9. Changes to This Policy',
        content:
          'We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated revision date. We encourage you to review this policy periodically.',
      },
      {
        title: '10. Contact Us',
        content:
          'If you have any questions or concerns about this Privacy Policy or how your data is handled, please reach out to us at support@namoprint.com or visit our Contact page.',
      },
    ],
    ctaTitle: 'Have questions about your data?',
    ctaContent: 'Our team is happy to help clarify anything related to your privacy.',
    ctaButtonLabel: 'Contact Us',
    ctaButtonHref: '/contact',
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms &',
    titleAccent: 'Conditions',
    updatedLabel: 'Last updated: July 14, 2026',
    intro:
      'Please read these Terms and Conditions carefully before using the Namo Prints website or placing an order with us.',
    sections: [
      {
        title: '1. Acceptance of Terms',
        content:
          'By accessing or using the Namo Prints website and services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our website or services.',
      },
      {
        title: '2. Orders and Payments',
        content:
          'All orders placed through our website are subject to availability and confirmation. Prices are listed in the applicable currency and may change without prior notice. Full or partial payment may be required before production begins, depending on the order type.',
      },
      {
        title: '3. Custom Designs and Approval',
        content:
          'For customized products, you are responsible for providing accurate design files, text, and specifications. Once a design proof is approved by you, we are not liable for errors, spelling mistakes, or layout issues present in the approved design.',
      },
      {
        title: '4. Production and Delivery',
        content:
          'Production timelines and delivery estimates provided are approximate and may vary due to order volume, customization complexity, or unforeseen circumstances. We are not responsible for delays caused by third-party couriers or shipping partners.',
      },
      {
        title: '5. Returns, Refunds & Cancellations',
        content:
          'Because most of our products are custom-made, we generally do not accept returns or offer refunds once production has started, except in cases of defective products or errors on our part. Cancellations requested before production begins may be eligible for a full or partial refund.',
      },
      {
        title: '6. Bulk Order Pricing',
        content:
          'Custom pricing offered on bulk orders is subject to minimum quantity requirements and may be modified or withdrawn at our discretion without prior notice.',
      },
      {
        title: '7. Intellectual Property',
        content:
          'All content on this website, including logos, graphics, and designs created by Namo Prints, remain our intellectual property. You may not reproduce, distribute, or use our original designs without written permission.',
      },
      {
        title: '8. User-Submitted Content',
        content:
          'By uploading designs, images, or text for printing, you confirm that you own the rights to that content or have obtained proper authorization to use it. We are not liable for any copyright infringement resulting from content you submit.',
      },
      {
        title: '9. Limitation of Liability',
        content:
          'To the maximum extent permitted by law, Namo Prints shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products.',
      },
      {
        title: '10. Contact',
        content:
          'For questions about these Terms and Conditions, contact us at support@namoprint.com or through our Contact page.',
      },
    ],
    ctaTitle: 'Need help with an order?',
    ctaContent: 'Our support team is ready to assist you.',
    ctaButtonLabel: 'Contact Us',
    ctaButtonHref: '/contact',
  },
  {
    slug: 'refund-policy',
    title: 'Refund',
    titleAccent: 'Policy',
    updatedLabel: 'Last updated: July 14, 2026',
    intro:
      'At Namo Prints, we strive to deliver high-quality, damage-free products to every customer. However, if your product arrives cracked or damaged during transit, you must follow the process outlined below to be eligible for a refund or replacement.',
    highlightTitle: 'Mandatory Requirement â€” Unboxing Video',
    highlightContent:
      'If your product arrives cracked or damaged, you must record a video of the product â€” showing it in front of the delivery person and while opening the box. This video must be sent to us on WhatsApp, and only then will your refund be processed. Without this video, no damage/crack claim will be accepted under any circumstances.',
    sections: [
      {
        title: '1. Record in Front of the Delivery Person',
        content:
          'As soon as your order is delivered, before accepting it, start recording a continuous video of the package in front of the delivery person. The video should not have any pauses or cuts.',
      },
      {
        title: '2. Record While Opening the Box',
        content:
          'From the sealed package to opening the box, the entire process must be recorded on camera â€” no editing or cutting is allowed at any point.',
      },
      {
        title: '3. Clearly Show the Product',
        content:
          'If the product is cracked or damaged, it must be clearly shown in the video â€” zoom in on the damaged area and capture it from multiple angles.',
      },
      {
        title: '4. Send the Video on WhatsApp',
        content:
          'This unboxing video must be sent to us on WhatsApp immediately, within 24 hours of delivery, along with your order ID.',
      },
      {
        title: 'When a Refund Will Not Be Given',
        content:
          'If no unboxing video was recorded in front of the delivery person, or the video is incomplete or edited, or the damage claim is reported after 24 hours, a refund or replacement will not be possible in such cases. Additionally, incorrect design or customization that the customer has already approved is also not eligible for a refund.',
      },
      {
        title: 'What Happens After You Send the Video',
        content:
          'Once the video is verified, our team will confirm your refund or replacement within 2-3 business days. Once approved, the refund amount will be credited to your original payment method within 5-7 business days.',
      },
    ],
    bulletsTitle: 'Refund Conditions',
    bullets: [
      'The video must be recorded in front of the delivery person, without any breaks â€” videos recorded afterward will not be accepted.',
      'The package seal, label, and order ID must be clearly visible in the video.',
      'The entire process, from opening the box to removing the product, must be included in the video.',
      'The damaged area must be shown in close-up in the video.',
      'The video must not be edited, cut, or stitched together from multiple clips â€” only a single, unedited video will be accepted.',
      'The video must be sent to us on WhatsApp within 24 hours of delivery.',
    ],
    ctaTitle: 'Received a Damaged Product?',
    ctaContent: 'Send your unboxing video on WhatsApp to start the refund process.',
    ctaButtonLabel: 'Send Video on WhatsApp',
    ctaButtonHref:
      'https://wa.me/919098570277?text=Hi%20Namo%20Print%2C%20I%20received%20a%20damaged%2Fcracked%20product%20and%20want%20to%20raise%20a%20refund%20request.%20I%20have%20the%20unboxing%20video%20ready.',
  },
  {
    slug: 'shipping-policy',
    title: 'Shipping',
    titleAccent: 'Policy',
    updatedLabel: 'Last updated: July 14, 2026',
    intro:
      'We work to deliver your custom products quickly and safely. This Shipping Policy explains how we process, ship, and track your orders.',
    sections: [
      {
        title: '1. Order Processing Time',
        content:
          'All orders are processed within 1-2 business days after design approval and payment confirmation. Custom and bulk orders may require additional processing time depending on order complexity and quantity.',
      },
      {
        title: '2. Shipping Timeframes',
        content:
          'Standard delivery typically takes 3-7 business days depending on your location. Remote areas may experience slightly longer delivery times. Estimated delivery dates are provided at checkout but are not guaranteed due to factors beyond our control.',
      },
      {
        title: '3. Shipping Charges',
        content:
          'Shipping charges are calculated based on your delivery location, order weight, and package size, and will be displayed at checkout before you confirm your order. Free shipping may be offered on select products or orders above a certain value.',
      },
      {
        title: '4. Order Tracking',
        content:
          "Once your order is shipped, you will receive a tracking number via email, SMS, or WhatsApp. You can use this number to track your shipment's status directly through the courier partner's website.",
      },
      {
        title: '5. Delivery Attempts',
        content:
          'Our courier partners typically make up to 2-3 delivery attempts. If delivery is unsuccessful after multiple attempts, the package may be returned to us, and additional shipping charges may apply for re-delivery.',
      },
      {
        title: '6. Damaged Shipments',
        content:
          'If your package arrives damaged, please refer to our Refund Policy. An unboxing video recorded in front of the delivery person is mandatory to be eligible for a refund or replacement.',
      },
      {
        title: '7. Changes to This Policy',
        content:
          'We may update this Shipping Policy from time to time to reflect changes in our shipping partners or processes. Updates will be posted on this page.',
      },
    ],
    ctaTitle: 'Questions about delivery?',
    ctaContent: 'Reach out to our team and we will help track or clarify your shipment.',
    ctaButtonLabel: 'Contact Us',
    ctaButtonHref: '/contact',
  },
];

export async function ensureLegalPages() {
  const rename = (text = '') => String(text).replace(/Namo Print(?!s)/g, 'Namo Prints');

  for (const page of DEFAULT_LEGAL_PAGES) {
    const existing = await LegalPage.findOne({ slug: page.slug });
    if (!existing) {
      await LegalPage.create(page);
      continue;
    }

    let changed = false;
    const nextIntro = rename(existing.intro);
    if (nextIntro !== existing.intro) {
      existing.intro = nextIntro;
      changed = true;
    }
    existing.sections?.forEach((section) => {
      const nextContent = rename(section.content);
      const nextTitle = rename(section.title);
      if (nextContent !== section.content) {
        section.content = nextContent;
        changed = true;
      }
      if (nextTitle !== section.title) {
        section.title = nextTitle;
        changed = true;
      }
    });
    if (changed) await existing.save();
  }
  return LegalPage.find({ slug: { $in: LEGAL_PAGE_SLUGS } }).lean();
}
