export interface BiomarkerExtended extends Biomarker {
  input_settings?: BiomarkerInputSettings;
  // Importing
  import_format_single?: string[];
};

interface RangeSet {
  male?: RangeSpecification;
  female?: RangeSpecification;
  // ... extendable with special gender relevant categorization
  pregnant?: RangeSpecification;
  postmenopausal?: RangeSpecification;
  // Menstrual cycle
  menses_phase?: RangeSpecification;
  follicular_phase?: RangeSpecification;
  ovulation_phase?: RangeSpecification;
  luteal_phase?: RangeSpecification;
  diverse?: RangeSpecification;
}

interface RangeSpecification {
  norm?: RangeList, // No further specification (norm)
  // ... extendable with demographic/ phenotypic specification e.g. ethnicity, skin type, weight, height, bmi
  ethnicity?: { [ethnicity: string]: RangeList },
  skin_type?: { [skin_type_number: string]: RangeList },
  weight?: { [weight: string]: RangeList },
  height?: { [height: string]: RangeList },
  bmi?: { [bmi: string]: RangeList },
}

interface RangeList {
  // Index-Sensitive handling of range-categories (biologically valid, medical, optimal for general better health, self calculated reference population data)
  // Format: { [Age]: [Range-Array-Format], ... } 
  // e.g. { 20:[0,60,60,80,160,170,200,300], 100: [0,60,60,80,160,170,200,300] }
  // Range-Array-Format
  // Eight-Format => Min-Bio valid, Min-At Risk, Min-Medical, Min-Optimal, Max-Optimal, Max-Medical, Max-At Risk, Max-Bio valid. Values for displaying Red, Yellow, Light Green, Dark Green colored range bar
  // Fourteen-Format => If split "green zone" than this format defines two green zones (Rare Case)
  // Zone descriptions: [Critical Low/High, Attention, out of range], [Low/ High, At Risk, Low end/ High end of normal range], [Medical Ok, Not at Risk, Normal Range], [Optimal, Supra-Optimal]
  [age: string]: number[];
}

export interface Biomarker {
  id: string;
  slug?: string;
  ref_loinc_id?: string;
  synonyms?: string[];
  category?: string;            // TODO: refactor to tags
  type?: string;                // TODO: refactor to tags
  subtype?: string;             // TODO: refactor to tags
  classification?: string;      // TODO: refactor to tags
  abbreviated_name?: string;
  name: string;
  default_value?: number;
  default_unit_id: string;   // UCUM Code
  value_type?: BiomarkerInputValues;
  description?: string;
  references?: string[];        // TODO: refactor to reference_urls
  tags?: string[];
  // Ranges as multi-dimensional matrix: 
  ranges?: RangeSet,
  ranges_z_score?: RangeSet,
  ranges_references?: string[];
};

export interface BiomarkerInputSettings {
  value_2?: boolean;
  unit_2?: string;
  time_interval?: boolean;
  default_value?: boolean | number;
  hideMethod?: boolean; // if method field should be shown
  hideValue?: boolean; // if value field should be shown
  // Show medication or supplementation fields:
  description?: boolean;
  route?: boolean;
  prescription_trigger?: boolean;
  schedule?: boolean;
  generic_name?: boolean;
  trade_name?: boolean;
  strength?: boolean;
  strength_unit?: boolean,
  rxnorm_code?: boolean;
  // TODO:
  // sleep 
  // Metabolomics blood scan
  // Compound biomarkers
};

export interface SpecialParameter extends Biomarker {
  imperial_unit?: string;
  [key: string]: any
};

export type BiomarkerInputValues = 'bool' | 'int' | 'float' | 'rating_5' | 'rating_10' | 'percentage';