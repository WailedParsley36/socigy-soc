"use client";

import { useState } from "react";
import { UserImportContact } from "@/lib/api/RelationshipHelper";
import { XMarkIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface ImportContactsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: UserImportContact[]) => void;
}

export default function ImportContactsModal({
  isOpen,
  onClose,
  onImport,
}: ImportContactsModalProps) {
  const [contacts, setContacts] = useState<UserImportContact[]>([
    {
      nickname: "",
      firstName: "",
      lastName: "",
      emails: [""],
      phoneNumbers: [""],
    },
  ]);

  const handleAddContact = () => {
    setContacts([
      ...contacts,
      {
        nickname: "",
        firstName: "",
        lastName: "",
        emails: [""],
        phoneNumbers: [""],
      },
    ]);
  };

  const handleRemoveContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const handleContactChange = (
    index: number,
    field: keyof UserImportContact,
    value: string
  ) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  const handleAddEmail = (contactIndex: number) => {
    const updatedContacts = [...contacts];
    const currentEmails = updatedContacts[contactIndex].emails || [];
    updatedContacts[contactIndex].emails = [...currentEmails, ""];
    setContacts(updatedContacts);
  };

  const handleRemoveEmail = (contactIndex: number, emailIndex: number) => {
    const updatedContacts = [...contacts];
    const currentEmails = updatedContacts[contactIndex].emails || [];
    updatedContacts[contactIndex].emails = currentEmails.filter(
      (_, i) => i !== emailIndex
    );
    setContacts(updatedContacts);
  };

  const handleEmailChange = (
    contactIndex: number,
    emailIndex: number,
    value: string
  ) => {
    const updatedContacts = [...contacts];
    const currentEmails = [...(updatedContacts[contactIndex].emails || [])];
    currentEmails[emailIndex] = value;
    updatedContacts[contactIndex].emails = currentEmails;
    setContacts(updatedContacts);
  };

  const handleAddPhone = (contactIndex: number) => {
    const updatedContacts = [...contacts];
    const currentPhones = updatedContacts[contactIndex].phoneNumbers || [];
    updatedContacts[contactIndex].phoneNumbers = [...currentPhones, ""];
    setContacts(updatedContacts);
  };

  const handleRemovePhone = (contactIndex: number, phoneIndex: number) => {
    const updatedContacts = [...contacts];
    const currentPhones = updatedContacts[contactIndex].phoneNumbers || [];
    updatedContacts[contactIndex].phoneNumbers = currentPhones.filter(
      (_, i) => i !== phoneIndex
    );
    setContacts(updatedContacts);
  };

  const handlePhoneChange = (
    contactIndex: number,
    phoneIndex: number,
    value: string
  ) => {
    const updatedContacts = [...contacts];
    const currentPhones = [
      ...(updatedContacts[contactIndex].phoneNumbers || []),
    ];
    currentPhones[phoneIndex] = value;
    updatedContacts[contactIndex].phoneNumbers = currentPhones;
    setContacts(updatedContacts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty contacts
    const validContacts = contacts.filter(
      (contact) =>
        (contact.nickname && contact.nickname.trim()) ||
        (contact.firstName && contact.firstName.trim()) ||
        (contact.lastName && contact.lastName.trim()) ||
        (contact.emails && contact.emails.some((email) => email.trim())) ||
        (contact.phoneNumbers &&
          contact.phoneNumbers.some((phone) => phone.trim()))
    );

    onImport(validContacts);
    setContacts([
      {
        nickname: "",
        firstName: "",
        lastName: "",
        emails: [""],
        phoneNumbers: [""],
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Import Contacts</h2>
          <button
            onClick={() => {
              setContacts([
                {
                  nickname: "",
                  firstName: "",
                  lastName: "",
                  emails: [""],
                  phoneNumbers: [""],
                },
              ]);
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {contacts.map((contact, contactIndex) => (
              <div key={contactIndex} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium text-gray-700">
                    Contact #{contactIndex + 1}
                  </h3>
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(contactIndex)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nickname
                    </label>
                    <input
                      type="text"
                      value={contact.nickname || ""}
                      onChange={(e) =>
                        handleContactChange(
                          contactIndex,
                          "nickname",
                          e.target.value
                        )
                      }
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
                      onChange={(e) =>
                        handleContactChange(
                          contactIndex,
                          "firstName",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="First Name"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={contact.lastName || ""}
                      onChange={(e) =>
                        handleContactChange(
                          contactIndex,
                          "lastName",
                          e.target.value
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Last Name"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Addresses
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddEmail(contactIndex)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Email
                    </button>
                  </div>
                  {contact.emails?.map((email, emailIndex) => (
                    <div key={emailIndex} className="flex items-center mb-2">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                          handleEmailChange(
                            contactIndex,
                            emailIndex,
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Email Address"
                      />
                      {contact.emails && contact.emails.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveEmail(contactIndex, emailIndex)
                          }
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
                      onClick={() => handleAddPhone(contactIndex)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Phone
                    </button>
                  </div>
                  {contact.phoneNumbers?.map((phone, phoneIndex) => (
                    <div key={phoneIndex} className="flex items-center mb-2">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) =>
                          handlePhoneChange(
                            contactIndex,
                            phoneIndex,
                            e.target.value
                          )
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Phone Number"
                      />
                      {contact.phoneNumbers &&
                        contact.phoneNumbers.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              handleRemovePhone(contactIndex, phoneIndex)
                            }
                            className="ml-2 text-gray-500 hover:text-red-500"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddContact}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:text-indigo-600 hover:border-indigo-300 flex items-center justify-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Another Contact
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setContacts([
                  {
                    nickname: "",
                    firstName: "",
                    lastName: "",
                    emails: [""],
                    phoneNumbers: [""],
                  },
                ]);
                onClose();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              Import Contacts
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
