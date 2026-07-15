"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeProspectPriority = computeProspectPriority;
exports.sortProspectsForSend = sortProspectsForSend;
/** Rep density boost — counties with more published reps are prioritised. */
const REP_COUNTY_BOOST = {
    kent: 20,
    london: 15,
    essex: 12,
    surrey: 10,
    sussex: 10,
    hampshire: 10,
    'greater london': 15,
};
function computeProspectPriority(prospect) {
    let score = prospect.priorityScore;
    if (prospect.emailScore)
        score += Math.round(prospect.emailScore / 4);
    const sources = prospect.sources ?? [];
    if (sources.includes('laa'))
        score += 10;
    if (sources.includes('dscc'))
        score += 8;
    if (sources.includes('directory'))
        score += 25;
    if (prospect.websiteUrl)
        score += 5;
    if (prospect.prospectType === 'solicitor' && prospect.emailConfidence === 'crawled')
        score += 8;
    const county = (prospect.county ?? '').toLowerCase();
    for (const [key, boost] of Object.entries(REP_COUNTY_BOOST)) {
        if (county.includes(key)) {
            score += boost;
            break;
        }
    }
    if (prospect.emailConfidence === 'guessed')
        score -= 15;
    return score;
}
function sortProspectsForSend(prospects) {
    return [...prospects].sort((a, b) => computeProspectPriority(b) - computeProspectPriority(a));
}
