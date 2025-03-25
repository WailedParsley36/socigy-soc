"use client";

import { useState, useEffect } from "react";
import { UserImportContact } from "@/lib/api/RelationshipHelper";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: UserImportContact) => void;
  contact: UserImportContact;
}

export default function EditContactModal({
  isOpen,
  onClose,
  onSave,
  contact: initialContact,
}: EditContactModalProps) {
  const [contact, setContact] = useState<UserImportContact>(initialContact);

  useEffect(() => {
    setContact(initialContact);
  }, [initialContact, isOpen]);

  const handleChange = (field: keyof UserImportContact, value: string) => {
    setContact({ ...contact, [field]: value });
  };

  const handleAddEmail = () => {
    const currentEmails = contact.emails || [];
    setContact({ ...contact, emails: [...currentEmails, ""] });
  };

  const handleRemoveEmail = (index: number) => {
    const currentEmails = [...(contact.emails || [])];
    currentEmails.splice(index, 1);
    setContact({ ...contact, emails: currentEmails });
  };

  const handleEmailChange = (index: number, value: string) => {
    const currentEmails = [...(contact.emails || [])];
    currentEmails[index] = value;
    setContact({ ...contact, emails: currentEmails });
  };

  const handleAddPhone = () => {
    const currentPhones = contact.phoneNumbers || [];
    setContact({ ...contact, phoneNumbers: [...currentPhones, ""] });
  };

  const handleRemovePhone = (index: number) => {
    const currentPhones = [...(contact.phoneNumbers || [])];
    currentPhones.splice(index, 1);
    setContact({ ...contact, phoneNumbers: currentPhones });
  };

  const handlePhoneChange = (index: number, value: string) => {
    const currentPhones = [...(contact.phoneNumbers || [])];
    currentPhones[index] = value;
    setContact({ ...contact, phoneNumbers: currentPhones });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(contact);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Contact</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nickname
              </label>
              <input
                type="text"
                value={contact.nickname || ""}
                onChange={(e) => handleChange("nickname", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Nickname"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={contact.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="First Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={contact.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Last Name"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Email Addresses
                </label>
                <button
                  type="button"
                  onClick={handleAddEmail}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Email
                </button>
              </div>
              {contact.emails?.map((email, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Email Address"
                  />
                  {contact.emails && contact.emails.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Phone Numbers
                </label>
                <button
                  type="button"
                  onClick={handleAddPhone}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Phone
                </button>
              </div>
              {contact.phoneNumbers?.map((phone, index) => (
                <div key={index} className="flex items-center mb-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => handlePhoneChange(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Phone Number"
                  />
                  {contact.phoneNumbers && contact.phoneNumbers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePhone(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
