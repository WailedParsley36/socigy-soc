"use client";

import { useState, useEffect } from "react";
import {
  RelationshipAPI,
  ContactResponse,
  UserImportContact,
} from "@/lib/api/RelationshipHelper";
import ContactCard from "@/components/contacts/ContactCard";
import ImportContactsModal from "@/components/contacts/modals/ImportContactsModal";
import { PlusIcon, UserGroupIcon, UserIcon } from "@heroicons/react/24/outline";
import { Guid } from "@/lib/structures/Guid";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "matched" | "unmatched">(
    "all"
  );

  useEffect(() => {
    loadContacts();
  }, [activeTab]);

  const loadContacts = async () => {
    setIsLoading(true);
    let matching: boolean | undefined;

    if (activeTab === "matched") matching = true;
    else if (activeTab === "unmatched") matching = false;

    const response = await RelationshipAPI.listContacts(matching, 50, 0);
    if (response.result) {
      setContacts(response.result);
    }
    setIsLoading(false);
  };

  const handleImportContacts = async (contacts: UserImportContact[]) => {
    await RelationshipAPI.addContacts(contacts);
    setIsImportModalOpen(false);
    loadContacts();
  };

  const handleRemoveContact = async (contactId: Guid) => {
    await RelationshipAPI.removeContacts([contactId]);
    setContacts(contacts.filter((contact) => contact.id !== contactId));
  };

  const handleEditContact = async (
    contactId: Guid,
    contact: UserImportContact
  ) => {
    await RelationshipAPI.editContact(contactId, contact);
    loadContacts();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Contacts</h1>
        <button
          onClick={() => setIsImportModalOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          Import Contacts
        </button>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`flex items-center gap-2 py-3 px-4 ${
            activeTab === "all"
              ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("all")}
        >
          <UserGroupIcon className="h-5 w-5" />
          All Contacts
        </button>
        <button
          className={`flex items-center gap-2 py-3 px-4 ${
            activeTab === "matched"
              ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("matched")}
        >
          <UserIcon className="h-5 w-5" />
          Matched Users
        </button>
        <button
          className={`flex items-center gap-2 py-3 px-4 ${
            activeTab === "unmatched"
              ? "border-b-2 border-indigo-600 text-indigo-600 font-medium"
              : "text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setActiveTab("unmatched")}
        >
          <UserIcon className="h-5 w-5" />
          Unmatched Contacts
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contacts.length > 0 ? (
            contacts.map((contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onRemove={handleRemoveContact}
                onEdit={handleEditContact}
              />
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <p className="text-gray-500">No contacts found.</p>
            </div>
          )}
        </div>
      )}

      <ImportContactsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportContacts}
      />
    </div>
  );
}
