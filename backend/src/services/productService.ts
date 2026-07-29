/**
 * Product service barrel — re-exports all functions from sub-modules.
 *
 * import * as productService from '../services/productService.js'
 * still works because everything is re-exported here.
 */

export type { ProductFilters } from './productQueries.js'
export {
  listProducts, listStorefrontProducts,
  getStorefrontProduct, getRelatedProducts,
  getFeaturedProducts, getNewArrivals, getEmergencyProducts,
  getProductCategoryAndBrand, getFilterCounts, getProduct,
} from './productQueries.js'

export {
  createProduct, updateProduct, archiveProduct,
  bulkUpdate, duplicateProduct,
} from './productMutations.js'

export {
  importProducts, exportProductsCsv,
} from './productImportExport.js'
