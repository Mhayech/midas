import LocalizedStrings from 'localized-strings'
import * as langHelper from '@/utils/langHelper'

const strings = new LocalizedStrings({
  fr: {
    CONTRACTS: 'Contrats',
    CONTRACT_NUMBER: 'Numéro de contrat',
    CUSTOMER: 'Client',
    CAR_PLATE: 'Immatriculation',
    GENERATED_AT: 'Généré le',
    FILE_SIZE: 'Taille',
    ACTIONS: 'Actions',
    DOWNLOAD: 'Télécharger',
    DELETE_CONTRACT: 'Supprimer le contrat',
    DELETE_CONTRACT_CONFIRM: 'Êtes-vous sûr de vouloir supprimer ce contrat ?',
    SEARCH_PLACEHOLDER: 'Rechercher par numéro, client ou fournisseur...',
  },
  en: {
    CONTRACTS: 'Contracts',
    CONTRACT_NUMBER: 'Contract Number',
    CUSTOMER: 'Customer',
    CAR_PLATE: 'License Plate',
    GENERATED_AT: 'Generated At',
    FILE_SIZE: 'Size',
    ACTIONS: 'Actions',
    DOWNLOAD: 'Download',
    DELETE_CONTRACT: 'Delete Contract',
    DELETE_CONTRACT_CONFIRM: 'Are you sure you want to delete this contract?',
    SEARCH_PLACEHOLDER: 'Search by number, customer or supplier...',
  },
  es: {
    CONTRACTS: 'Contratos',
    CONTRACT_NUMBER: 'Número de contrato',
    CUSTOMER: 'Cliente',
    CAR_PLATE: 'Matrícula',
    GENERATED_AT: 'Generado el',
    FILE_SIZE: 'Tamaño',
    ACTIONS: 'Acciones',
    DOWNLOAD: 'Descargar',
    DELETE_CONTRACT: 'Eliminar contrato',
    DELETE_CONTRACT_CONFIRM: '¿Está seguro de que desea eliminar este contrato?',
    SEARCH_PLACEHOLDER: 'Buscar por número, cliente o proveedor...',
  },
})

langHelper.setLanguage(strings)
export { strings }
