// Backward compatibility redirect for db files
export * from './db/drugs';
export * from './db/food-clashes';
export * from './db/interactions';
export { localDrugInteractions as localDrugInteractions } from './db/interactions';
export { localFoodClashesDB as localFoodClashesDB } from './db/food-clashes';
export { localAIFallbackDB as localAIFallbackDB } from './db/drugs';
