export interface FranceTravailTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface FranceTravailSearchResponse {
  resultats: FranceTravailOffer[];
  filtresPossibles?: unknown[];
  contentRange?: { minRange: number; maxRange: number; maxContentRange: number };
}

export interface FranceTravailOffer {
  id: string;
  intitule: string;
  description: string | null;
  dateCreation: string | null;
  dateActualisation: string | null;
  lieuTravail: {
    libelle: string | null;
    latitude: number | null;
    longitude: number | null;
    codePostal: string | null;
    commune: string | null;
  } | null;
  entreprise: {
    nom: string | null;
    description: string | null;
    logo: string | null;
    url: string | null;
  } | null;
  typeContrat: string | null;
  typeContratLibelle: string | null;
  natureContrat: string | null;
  experienceExige: string | null;
  salaire: {
    libelle: string | null;
    commentaire: string | null;
  } | null;
  origineOffre: {
    origine: string | null;
    urlOrigine: string | null;
  } | null;
  qualitesProfessionnelles?: { libelle: string; description: string }[];
}
