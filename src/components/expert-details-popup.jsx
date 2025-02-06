"use client";
import React, { useEffect, useState } from 'react';
import CompanyDetailsPopup from './company-details-popup';
import Image from 'next/image';
import ResearchAIAgentPopup from './research-ai-agent-popup';
import { toast } from 'react-hot-toast';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23CBD5E0' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const ExpertDetailsPopup = ({ expert, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showCompanyDetails, setShowCompanyDetails] = useState(false);
  const [editedExpert, setEditedExpert] = useState(expert);
  const [showResearchAgent, setShowResearchAgent] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // Add debug logging
  useEffect(() => {
    console.log('Expert data in popup:', expert);
  }, [expert]);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Helper function to render text with ellipsis if too long
  const renderText = (text, maxLength = 50) => {
    if (!text || text === '-') return '-';
    const textString = String(text); // Convert to string
    if (textString.length <= maxLength) return textString;
    return (
      <span title={textString}>
        {textString.substring(0, maxLength)}...
      </span>
    );
  };

  // Helper function to render clickable URLs
  const renderUrl = (url, label = url) => {
    if (!url || url === '-') return '-';
    return (
      <a 
        href={url.startsWith('http') ? url : `https://${url}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline break-all"
      >
        {label}
      </a>
    );
  };

  const renderExpertiseWithSources = () => {
    const expertise = getExpertiseArray(expert);
    
    if (!expertise?.length) {
      return (
        <div className="text-gray-500 italic">
          Keine Expertise angegeben
          <div className="text-xs text-gray-400 mt-1">
            Quelle: Keine Daten verfügbar
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {expertise.map((item, index) => {
          const source = expert.sources?.find(source => 
            source.type === 'expertise' && source.tags?.includes(item)
          );

          return (
            <div key={index} className="flex flex-col">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm w-fit">
                {item}
              </span>
              <div className="text-xs text-gray-500 mt-1 ml-2">
                {source ? (
                  <>
                    Quelle: 
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      {source.url}
                    </a>
                    <span className="text-gray-400 ml-1">
                      (Verifiziert: {source.date_accessed})
                    </span>
                  </>
                ) : (
                  <>
                    Quelle: KI-basierte Extraktion aus öffentlichen Profildaten
                    <i className="fas fa-robot ml-1 text-gray-400" title="Automatisch extrahiert"></i>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const handleSave = async () => {
    try {
      // Create updated expert object with proper image structure
      const updatedExpert = {
        ...editedExpert,
        personalInfo: {
          ...editedExpert.personalInfo,
          image: editedExpert.personalInfo?.image || editedExpert.personalInfo?.imageUrl || editedExpert.imageUrl
        }
      };

      // Clean up any duplicate image fields
      delete updatedExpert.imageUrl;
      if (updatedExpert.personalInfo) {
        delete updatedExpert.personalInfo.imageUrl;
      }

      await onUpdate(updatedExpert);
      setIsEditing(false);
      toast.success('Änderungen gespeichert');
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('Fehler beim Speichern der Änderungen');
    }
  };

  const handleResearchResults = async (selectedData) => {
    try {
      const updatedExpert = {
        ...expert,
        ...selectedData,
        personalInfo: {
          ...expert.personalInfo,
          ...selectedData.personalInfo,
          // Handle profile image separately with validation
          ...(selectedData.profile_image && {
            image: selectedData.profile_image.trim()
          })
        }
      };
      
      // Remove profile_image from the root level if it exists
      if ('profile_image' in updatedExpert) {
        delete updatedExpert.profile_image;
      }

      // Validate the image URL before saving
      if (updatedExpert.personalInfo?.image) {
        const imageUrl = updatedExpert.personalInfo.image;
        // Only save if it's a valid image URL
        if (!imageUrl.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i)) {
          delete updatedExpert.personalInfo.image;
        }
      }
      
      await onUpdate(updatedExpert);
      
      // Show success message
      console.log('Expert data updated with AI research results');
    } catch (error) {
      console.error('Error updating expert with research results:', error);
    }
  };

  const handleEnrichment = async () => {
    setShowResearchAgent(true);
  };

  // Add this helper function to render editable fields
  const renderEditableField = (label, value, fieldName, type = "text") => {
    return (
      <>
        <span className="text-gray-500">{label}:</span>
        {isEditing ? (
          <input
            type={type}
            value={editedExpert[fieldName] || ''}
            onChange={(e) => setEditedExpert({
              ...editedExpert,
              [fieldName]: e.target.value
            })}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          <span className="break-words">{renderText(value)}</span>
        )}
      </>
    );
  };

  // Add this helper function to get expertise array
  const getExpertiseArray = (expert) => {
    if (Array.isArray(expert.expertise)) {
      return expert.expertise;
    }
    if (expert.expertise?.primary) {
      return expert.expertise.primary;
    }
    return [];
  };

  // Helper functions to get data
  const getName = () => {
    return expert.personalInfo?.fullName || 
           expert.name || 
           `${expert.personalInfo?.firstName || ''} ${expert.personalInfo?.lastName || ''}`.trim() ||
           'Unnamed Expert';
  };

  const getTitle = () => {
    return expert.currentRole?.title || 
           expert.institution?.position || 
           expert.titel || 
           'Keine Position angegeben';
  };

  const getOrganization = () => {
    return expert.currentRole?.organization || 
           expert.institution?.name || 
           expert.organisation || 
           '';
  };

  const getExpertise = () => {
    const expertise = [];
    // Add tags first
    if (expert.tags?.length) expertise.push(...expert.tags);
    // Add primary expertise
    if (expert.expertise?.primary?.length) expertise.push(...expert.expertise.primary);
    // Add secondary expertise
    if (expert.expertise?.secondary?.length) expertise.push(...expert.expertise.secondary);
    // Add focus area
    if (expert.currentRole?.focus) expertise.push(expert.currentRole.focus);
    // Add industries
    if (expert.expertise?.industries?.length) expertise.push(...expert.expertise.industries);
    
    return [...new Set(expertise)]; // Remove duplicates
  };

  const getSocialLinks = () => {
    return {
      linkedin: expert.profiles?.linkedin || expert.social_media?.linkedin || '',
      twitter: expert.profiles?.twitter || expert.social_media?.twitter || '',
      website: expert.profiles?.company || expert.institution?.website || expert.website || ''
    };
  };

  const getContact = () => {
    return {
      email: expert.personalInfo?.email || expert.contact?.email || '',
      phone: expert.personalInfo?.phone || expert.contact?.phone || ''
    };
  };

  const getLanguages = () => {
    return expert.personalInfo?.languages || expert.languages || [];
  };

  // Add new helper for academic metrics
  const getAcademicMetrics = () => {
    return {
      publications: expert.academicMetrics?.publications?.total || 0,
      citations: expert.academicMetrics?.citations?.total || 0,
      hIndex: expert.academicMetrics?.hIndex || 0,
      sources: expert.academicMetrics?.publications?.sources || {}
    };
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
        {/* Header with image and basic info */}
        <div className="p-6">
          {/* Header with image and basic info */}
          <div className="flex items-start gap-6 mb-6">
            {/* Expert Image */}
            <div className="w-32 h-32 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">
              {expert.personalInfo?.image ? (
                <img
                  src={expert.personalInfo.image}
                  alt={getName()}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null; // Prevent infinite loop
                    e.target.src = '/experts/default-expert-avatar.png';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-600">
                  <span className="text-3xl font-bold">
                    {getName().charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Expert Info */}
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{getName()}</h2>
                  <div className="text-gray-600 mt-1">
                    <span className="font-medium">{getTitle()}</span>
                    {getOrganization() && (
                      <>
                        <span className="mx-2">·</span>
                        <span>{getOrganization()}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>

              {/* Edit/Save buttons */}
              <div className="flex gap-3 mt-4">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <i className="fas fa-edit mr-2"></i>
                  Bearbeiten
                </button>
                <button
                  onClick={handleEnrichment}
                  className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center"
                >
                  <i className="fas fa-magic mr-2"></i>
                  KI-Anreicherung
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <i className="fas fa-save mr-2"></i>
                  Speichern
                </button>
                <button
                  onClick={() => {
                    setEditedExpert(expert);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Abbrechen
                </button>
              </>
            )}
          </div>
        </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button
            className={`px-4 py-2 ${activeTab === 'info' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('info')}
          >
            Information
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'expertise' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('expertise')}
          >
            Expertise
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'contact' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('contact')}
          >
            Kontakt
          </button>
        </div>

        {/* Content */}
        {activeTab === 'info' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <section>
              <h3 className="font-semibold mb-2">Über</h3>
              <p className="text-gray-600">
                {expert.description || expert.bio || 'Keine Beschreibung verfügbar'}
              </p>
            </section>

            {/* Institution Info */}
            {expert.institution && (
              <section>
                <h3 className="font-semibold mb-2">Institution</h3>
                <div className="text-gray-600">
                  <p><strong>Name:</strong> {expert.institution.name}</p>
                  <p><strong>Position:</strong> {expert.institution.position}</p>
                  {expert.institution.department && (
                    <p><strong>Abteilung:</strong> {expert.institution.department}</p>
                  )}
                  {expert.institution.website && expert.institution.website !== "Nicht verfügbar" && (
                    <p>
                      <strong>Website:</strong>{' '}
                      <a href={expert.institution.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {expert.institution.website}
                      </a>
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* Current Role */}
            {expert.currentRole && (
              <section>
                <h3 className="font-semibold mb-2">Aktuelle Position</h3>
                <div className="text-gray-600">
                  <p><strong>Titel:</strong> {expert.currentRole.title}</p>
                  <p><strong>Organisation:</strong> {expert.currentRole.organization}</p>
                  {expert.currentRole.focus && (
                    <p><strong>Fokus:</strong> {expert.currentRole.focus}</p>
                  )}
                </div>
              </section>
            )}

            {/* Expertise Section */}
            <section>
              <h3 className="font-semibold mb-2">Expertise</h3>
              <div className="space-y-3">
                {expert.expertise?.primary?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Primäre Expertise</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {expert.expertise.primary.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {expert.expertise?.secondary?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Sekundäre Expertise</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {expert.expertise.secondary.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {expert.expertise?.industries?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Branchen</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {expert.expertise.industries.map((item, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Academic Metrics */}
            {expert.academicMetrics && (
              <section>
                <h3 className="font-semibold mb-2">Akademische Metriken</h3>
                <div className="grid grid-cols-2 gap-4">
                  {expert.academicMetrics.publications?.total !== null && (
                    <div>
                      <p className="text-sm text-gray-500">Publikationen</p>
                      <p className="text-lg font-semibold">{expert.academicMetrics.publications.total || '0'}</p>
                    </div>
                  )}
                  {expert.academicMetrics.hIndex !== null && (
                    <div>
                      <p className="text-sm text-gray-500">H-Index</p>
                      <p className="text-lg font-semibold">{expert.academicMetrics.hIndex || '0'}</p>
                    </div>
                  )}
                </div>
                {expert.academicMetrics.publications?.sources && (
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Quellen: {Object.keys(expert.academicMetrics.publications.sources).join(', ')}</p>
                  </div>
                )}
              </section>
            )}

            {/* Languages */}
            <section>
              <h3 className="font-semibold mb-2">Sprachen</h3>
              <div className="flex flex-wrap gap-2">
                {getLanguages().length > 0 ? getLanguages().map((lang, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 rounded text-sm">
                    {lang}
                  </span>
                )) : (
                  <span className="text-gray-500 italic">Keine Sprachen angegeben</span>
                )}
              </div>
            </section>

            {/* Source */}
            {expert.source && (
              <section>
                <h3 className="font-semibold mb-2">Quelle</h3>
                <p className="text-gray-600">{expert.source}</p>
              </section>
            )}

            {/* Last Enriched */}
            {expert.lastEnriched && (
              <section>
                <h3 className="font-semibold mb-2">Letzte Aktualisierung</h3>
                <p className="text-gray-600">
                  {new Date(expert.lastEnriched).toLocaleDateString('de-DE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </section>
            )}
          </div>
        )}

        {activeTab === 'expertise' && (
          <div className="space-y-6">
            {/* Expertise */}
            <section>
              <h3 className="font-semibold mb-2">Fachgebiete</h3>
              <div className="flex flex-wrap gap-2">
                {getExpertise().length > 0 ? getExpertise().map((item, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                    {item}
                  </span>
                )) : (
                  <span className="text-gray-500 italic">Keine Expertise angegeben</span>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-6">
            {/* Contact Info */}
            <section>
              <h3 className="font-semibold mb-2">Kontaktdaten</h3>
              <div className="space-y-2">
                {getContact().email && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-envelope text-gray-400"></i>
                    <a href={`mailto:${getContact().email}`} className="text-blue-600 hover:underline">
                      {getContact().email}
                    </a>
                  </div>
                )}
                {getContact().phone && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-phone text-gray-400"></i>
                    <a href={`tel:${getContact().phone}`} className="text-blue-600 hover:underline">
                      {getContact().phone}
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Social Links */}
            <section>
              <h3 className="font-semibold mb-2">Social Media & Web</h3>
                <div className="space-y-2">
                {getSocialLinks().linkedin && (
                  <div className="flex items-center gap-2">
                    <i className="fab fa-linkedin text-gray-400"></i>
                    <a href={getSocialLinks().linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      LinkedIn Profil
                    </a>
                  </div>
                )}
                {getSocialLinks().twitter && (
                  <div className="flex items-center gap-2">
                    <i className="fab fa-twitter text-gray-400"></i>
                    <a href={getSocialLinks().twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Twitter Profil
                    </a>
                    </div>
                )}
                {getSocialLinks().website && (
                  <div className="flex items-center gap-2">
                    <i className="fas fa-globe text-gray-400"></i>
                    <a href={getSocialLinks().website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Website
                    </a>
                </div>
              )}
              </div>
            </section>
          </div>
        )}

        {/* Description */}
        <section className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            <i className="fas fa-info-circle text-blue-500 mr-2"></i>
            Beschreibung
          </h3>
          {isEditing ? (
            <textarea
              value={editedExpert.description || ''}
              onChange={(e) => setEditedExpert({...editedExpert, description: e.target.value})}
              className="border rounded px-2 py-1 w-full h-32"
            />
          ) : (
            <p className="text-gray-700 whitespace-pre-line">
              {expert.description}
            </p>
          )}
        </section>

        {/* Sources Section */}
        {expert.sources && expert.sources.length > 0 && (
          <div className="mt-6">
            <section className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                <i className="fas fa-link text-blue-500 mr-2"></i>
                Quellen
              </h3>
              <div className="space-y-2">
                {expert.sources.map((source, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 text-sm">
                    <i className={`fas fa-${source.verified ? 'check-circle text-emerald-500' : 'info-circle text-gray-400'}`}></i>
                    <a 
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {source.url}
                    </a>
                    <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {source.type.replace('_', ' ')}
                    </span>
                    <span className="text-gray-400">
                      Zuletzt geprüft: {source.date_accessed}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Company Details Popup */}
      {showCompanyDetails && (
        <CompanyDetailsPopup
          companyId={expert.company.id}
          onClose={() => setShowCompanyDetails(false)}
        />
      )}

      {showResearchAgent && (
        <ResearchAIAgentPopup
          expert={expert}
          onClose={() => setShowResearchAgent(false)}
          onSave={handleResearchResults}
        />
      )}
    </div>
  );
};

export default ExpertDetailsPopup;
