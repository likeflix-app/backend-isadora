const pgp = require('pg-promise')();
require('dotenv').config();

// Create a direct database connection with proper SSL configuration
const connectionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Force SSL for production databases
};

const db = pgp(connectionConfig);

async function updatePacolinoPrice() {
  try {
    console.log('🔄 Starting price update for Pacolino...');
    
    // Search for Pacolino by full_name or nickname
    const talent = await db.oneOrNone(
      `SELECT id, full_name, nickname, price FROM talent_applications 
       WHERE LOWER(full_name) LIKE LOWER($1) OR LOWER(nickname) LIKE LOWER($1)`,
      ['%Pacolino%']
    );
    
    if (!talent) {
      console.log('❌ No talent found with name containing "Pacolino"');
      console.log('💡 Searching all talents to help you find the correct one...');
      
      const allTalents = await db.any(
        'SELECT id, full_name, nickname, price FROM talent_applications ORDER BY full_name'
      );
      
      console.log('\n📋 All talents in database:');
      allTalents.forEach((t, index) => {
        console.log(`   ${index + 1}. ${t.full_name}${t.nickname ? ` (${t.nickname})` : ''} - Price: "${t.price || '(empty)'}"`);
      });
      
      process.exit(1);
    }
    
    console.log(`\n✅ Found talent: ${talent.full_name}${talent.nickname ? ` (${talent.nickname})` : ''}`);
    console.log(`   Current price: "${talent.price || '(empty)'}"`);
    
    // Update the price to €€€€€
    const newPrice = '€€€€€';
    const updated = await db.one(
      `UPDATE talent_applications 
       SET price = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, full_name, nickname, price`,
      [newPrice, talent.id]
    );
    
    console.log(`\n🎉 Successfully updated price!`);
    console.log(`   Talent: ${updated.full_name}${updated.nickname ? ` (${updated.nickname})` : ''}`);
    console.log(`   New price: "${updated.price}"`);
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating price:', error);
    process.exit(1);
  }
}

// Run the script
updatePacolinoPrice();

