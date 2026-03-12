# **App Name**: FarmLink

## Core Features:

- Secure User Authentication: Enable phone number verification via OTP, followed by a clear process for users to select and confirm their role (Farmer, Retailer, Transporter).
- Farmer Crop Listing Management: Farmers can create new crop listings by providing details such as crop name, available quantity, desired price per unit, and uploading an associated image. All data is stored in Firestore.
- Retailer Marketplace Browse: Retailers can access a marketplace to view available crop listings. The marketplace will display items in a grid view and include search/filter capabilities by crop name.
- Offline Data Capture: Allow users to input and save new crop listings or other updates locally when offline, utilizing browser-side storage solutions like IndexedDB.
- On-Demand Data Synchronization: Implement a user-triggered mechanism (e.g., a 'Sync' button) to manually push locally stored offline changes to the central Firestore database once internet connectivity is detected.
- Multi-language Support: Provide a setting for users to seamlessly switch the application's language between English and Hindi, dynamically updating all relevant UI elements.

## Style Guidelines:

- Primary color: A vibrant, yet grounded green (#42AD1F) symbolizing agriculture and growth, serving as the main brand accent for interactive elements.
- Background color: A soft, almost imperceptible green-tinted white (#F1F4F0) providing a clean, airy canvas that is easy on the eyes.
- Accent color: A lively, contrasting lime-green (#BAE830) to draw attention to key calls to action and important notifications.
- Body and headline font: 'Inter' (sans-serif) for its modern, highly legible, and objective aesthetic, ensuring clarity across various screen sizes and conditions, suitable for both headlines and body text.
- Employ clear, bold line icons with an emphasis on universal recognition, avoiding intricate details for optimal legibility on low-end devices. Icons should represent farming tools, crops, transportation, and payment methods.
- Adopt a clean, intuitive layout with ample whitespace. Utilize a grid view for marketplaces and large, high-contrast buttons for primary actions, enhancing usability for all users.
- Incorporate subtle, performant UI animations primarily for user feedback, such as loading indicators or successful submission confirmations, without impacting performance on lower-spec devices.