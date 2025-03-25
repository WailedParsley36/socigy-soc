// components/contacts/ContactCard.tsx
import { useState } from "react";
import {
  ContactResponse,
  UserImportContact,
} from "@/lib/api/RelationshipHelper";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import EditContactModal from "./modals/EditContactsModal";
import { Guid } from "@/lib/structures/Guid";

interface ContactCardProps {
  contact: ContactResponse;
  onRemove: (id: Guid) => void;
  onEdit: (id: Guid, contact: UserImportContact) => void;
}

export default function ContactCard({
  contact,
  onRemove,
  onEdit,
}: ContactCardProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditContact = (updatedContact: UserImportContact) => {
    onEdit(contact.id, updatedContact);
    setIsEditModalOpen(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {contact.matchedUser ? (
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-green-600" />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              <UserIcon className="h-6 w-6 text-gray-500" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {contact.nickname || `${contact.firstName} ${contact.lastName}`}
            </h3>
            {contact.matchedUser && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Matched User
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {!isConfirmingDelete ? (
            <button
              onClick={() => setIsConfirmingDelete(true)}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="p-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onRemove(contact.id)}
                className="p-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {contact.emails && contact.emails.length > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <EnvelopeIcon className="h-4 w-4 mr-2" />
            <span>{contact.emails[0]}</span>
            {contact.emails.length > 1 && (
              <span className="ml-1 text-xs text-gray-500">
                +{contact.emails.length - 1} more
              </span>
            )}
          </div>
        )}

        {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
          <div className="flex items-center text-sm text-gray-600">
            <PhoneIcon className="h-4 w-4 mr-2" />
            <span>{contact.phoneNumbers[0]}</span>
            {contact.phoneNumbers.length > 1 && (
              <span className="ml-1 text-xs text-gray-500">
                +{contact.phoneNumbers.length - 1} more
              </span>
            )}
          </div>
        )}
      </div>

      <EditContactModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditContact}
        contact={{
          nickname: contact.nickname,
          firstName: contact.firstName,
          lastName: contact.lastName,
          emails: contact.emails,
          phoneNumbers: contact.phoneNumbers,
        }}
      />
    </div>
  );
}
