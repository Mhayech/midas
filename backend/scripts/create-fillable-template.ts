import { createFillableTemplate } from '../src/utils/pdfFormCreator.js'

// Run the template creator
createFillableTemplate()
  .then(() => {
    console.log('✅ Fillable template created successfully!')
    console.log('The new template is at: backend/template/CONTRAT-FILLABLE.pdf')
    process.exit(0)
  })
  .catch((err) => {
    console.error('❌ Error creating fillable template:', err)
    process.exit(1)
  })
