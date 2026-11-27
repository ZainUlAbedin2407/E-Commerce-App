import mongoose from "mongoose";

// Settings: singleton (one document, key "shop"). The admin settings
// screen edits it; the public /api/settings/public route exposes only
// the safe subset. paymentAccounts are NEVER returned by any public
// route: they are shown only after an order is placed, on the order
// page, and Zain fills them in himself in admin settings.
const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "shop" },
    shopName: { type: String, default: "AI Communication" },
    tagline: { type: String, default: "Smart Gadgets & Gear" },
    address: { type: String, default: "Shahjahan Electronics Market, Saddar, Karachi" },
    whatsappNumber: { type: String, default: "0335-5186552" },
    socials: {
      instagram: { type: String, default: "https://instagram.com/aicommunicationkhi" },
      facebook: { type: String, default: "https://facebook.com/aicommunicationkhi" },
      tiktok: { type: String, default: "https://tiktok.com/@aicommunicationkhi" },
      whatsappCommunity: { type: String, default: "https://chat.whatsapp.com/JEAoXmegXXtBcERB0ARNEb" },
    },
    logoUrl: { type: String, default: "/logo-ai-dark.png" },
    bannerUrl: { type: String, default: "/brand-banner.jpg" },
    announcement: {
      text: { type: String, default: "" },
      link: { type: String, default: "" },
      active: { type: Boolean, default: false },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
    delivery: {
      karachiFee: { type: Number, default: 250, min: 0 },
      otherFee: { type: Number, default: 300, min: 0 },
      freeUpToKg: { type: Number, default: 1, min: 0 },
      extraKgFee: { type: Number, default: 70, min: 0 },
      freeShippingThreshold: { type: Number, default: null, min: 0 },
    },
    codMaxTotal: { type: Number, default: 2000, min: 0 },
    // ALL EMPTY by default. Zain fills these himself in admin settings;
    // they are never published on public pages.
    paymentAccounts: {
      bankName: { type: String, default: "" },
      accountTitle: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      iban: { type: String, default: "" },
      jazzcashNumber: { type: String, default: "" },
      easypaisaNumber: { type: String, default: "" },
      raastQrUrl: { type: String, default: "" },
    },
    paymentMethods: {
      type: [
        {
          key: { type: String, required: true },
          label: { type: String, required: true },
          enabled: { type: Boolean, default: true },
        },
      ],
      default: [
        { key: "advance", label: "Advance payment (bank / JazzCash / Easypaisa)", enabled: true },
        { key: "cod", label: "Cash on Delivery", enabled: true },
      ],
    },
    reviewRequestDays: { type: Number, default: 5, min: 0, max: 30 },
  },
  { timestamps: true }
);

export default mongoose.models.Settings ||
  mongoose.model("Settings", settingsSchema);
