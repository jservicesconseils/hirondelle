export enum EventCategoryEnum {
  CONFERENCE = 'Conférence',
  ATELIER = 'Atelier',
  SEMINAIRE = 'Séminaire',
  FORMATION = 'Formation',
  RETRAITE = 'Retraite',
  AUTRE = 'Autre'
}

export enum EventStatusEnum {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ACTIVE = 'ACTIVE',
  FULL = 'FULL',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum EventTypeEnum {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE'
}

export const EVENT_CATEGORIES = [
  { key: EventCategoryEnum.CONFERENCE, label: 'Conférence' },
  { key: EventCategoryEnum.ATELIER, label: 'Atelier' },
  { key: EventCategoryEnum.SEMINAIRE, label: 'Séminaire' },
  { key: EventCategoryEnum.FORMATION, label: 'Formation' },
  { key: EventCategoryEnum.RETRAITE, label: 'Retraite' },
  { key: EventCategoryEnum.AUTRE, label: 'Autre' }
];

export const EVENT_STATUSES = [
  { key: EventStatusEnum.DRAFT, value: EventStatusEnum.DRAFT, label: 'Brouillon', color: '#6c757d' },
  { key: EventStatusEnum.PUBLISHED, value: EventStatusEnum.PUBLISHED, label: 'Publié', color: '#17a2b8' },
  { key: EventStatusEnum.ACTIVE, value: EventStatusEnum.ACTIVE, label: 'Actif', color: '#28a745' },
  { key: EventStatusEnum.FULL, value: EventStatusEnum.FULL, label: 'Complet', color: '#ffc107' },
  { key: EventStatusEnum.CANCELLED, value: EventStatusEnum.CANCELLED, label: 'Annulé', color: '#dc3545' },
  { key: EventStatusEnum.COMPLETED, value: EventStatusEnum.COMPLETED, label: 'Terminé', color: '#6f42c1' },
  { key: EventStatusEnum.ARCHIVED, value: EventStatusEnum.ARCHIVED, label: 'Archivé', color: '#6c757d' }
];

export const EVENT_TYPES = [
  { key: EventTypeEnum.PUBLIC, value: EventTypeEnum.PUBLIC, label: 'Public', color: '#007bff' },
  { key: EventTypeEnum.PRIVATE, value: EventTypeEnum.PRIVATE, label: 'Privé', color: '#343a40' }
]; 