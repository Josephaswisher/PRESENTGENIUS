/**
 * Visual Diagnosis Template - Image-based clinical diagnosis
 */

export const VISUAL_DIAGNOSIS_PROMPT_AUGMENT = `
CREATE A VISUAL DIAGNOSIS CHALLENGE:

TEMPLATE STRUCTURE:
- Image: Clinical image (describe for AI generation or use placeholder)
- Clinical Context: Brief history and presentation
- Question: "What is the most likely diagnosis?"
- Options: 4-5 diagnostic possibilities
- Annotated Reveal: Key findings highlighted

DESIGN:
- Large image display area
- Image zoom capability
- Clinical context sidebar
- Multiple choice answers below image
- On reveal: annotated image with arrows pointing to key findings
- Explanation of pathognomonic features

IMAGE TYPES TO INCLUDE:
- Dermatology: rashes, lesions, nail findings
- Radiology: chest X-ray, CT findings
- Ophthalmology: fundoscopic images
- Cardiology: ECG strips
- Physical exam: visible signs

TEACHING POINTS:
- Pattern recognition skills
- Key discriminating features
- Classic vs atypical presentations
- When to get additional imaging
`;
