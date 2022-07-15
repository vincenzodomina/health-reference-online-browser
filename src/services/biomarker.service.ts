////////////////////////////////////////////////////////////////////////////
// Biomarkers Service
////////////////////////////////////////////////////////////////////////////
import { Biomarker, BiomarkerInputValues } from 'src/models/biomarker.model';
import store from 'src/store';
import { updateBiomarkers } from 'src/slices/biomarkers.slice';
import healthReferences from 'src/constants/health_references.json';
import wait from 'src/utils/wait';

////////////////////////////////////////////////////////////////////////////

export const getAllBiomarkersService = (): Promise<{ biomarkers: Record<string, Biomarker> }> => {
    return new Promise((resolve, reject) => {
        wait(100)
            .then(doc => {
                let biomarkers: Record<string, Biomarker> = {};
                if (healthReferences?.length) {
                    healthReferences.map((reference) => {
                        const referenceEntry: Biomarker = {
                            id: reference.id,
                            name: reference.name,
                            default_unit_id: reference.default_unit_id,
                            ...(reference?.ref_loinc_id ? { loinc: reference.ref_loinc_id } : {}),
                            ...(reference?.synonyms ? { aliases: reference.synonyms } : {}),
                            ...(reference?.category ? { category: reference.category } : {}),
                            ...(reference?.type ? { type: reference.type } : {}),
                            ...(reference?.subtype ? { subtype: reference.subtype } : {}),
                            ...(reference?.classification ? { classification: reference.classification } : {}),
                            ...(reference?.abbreviated_name ? { name_short: reference.abbreviated_name } : {}),
                            ...(reference?.description ? { description: reference.description } : {}),
                            ...(reference?.value_type ? { value_type: reference.value_type as BiomarkerInputValues } : {}),
                            ...(reference?.default_value ? { default_value: parseFloat(reference.default_value.toString()) } : {}),
                            ...(reference?.references ? { references: reference.references } : {}),
                        }
                        biomarkers[reference.id] = referenceEntry;
                    });

                    console.log('[Biomarker service] Success getting Biomarkers');
                    store.dispatch(updateBiomarkers(biomarkers));

                } else {
                    console.error('[Biomarker service] Error: ', 'No Biomarkers');
                };

                resolve({ biomarkers });
            })
            .catch((error) => {
                console.error('[Biomarker service] Error: ', error);
                reject(error);
            });
    });
};

export const createBiomarkersService = (biomarkers: Record<string, Biomarker>): Promise<any> => {
    return new Promise((resolve, reject) => {
        wait(100)
            .then(res => {

                //store.dispatch(updateBiomarkers(biomarkers));
                resolve(true);
            })
            .catch((error) => {
                console.error('[Biomarker service] Error saving Biomarkers: ', error);
                reject(error);
            });
    });
};