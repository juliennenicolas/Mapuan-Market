require('dotenv').config();

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  try {
    console.log('Adding demo data...');

    const passwordHash = await bcrypt.hash('Demo123!', 12);

    // --------------------------------------------------
    // DEMO USERS
    // --------------------------------------------------

    const demoUsers = [
      {
        fullName: 'Reign Torre',
        email: 'reign.torre@mymail.mapua.edu.ph',
        campus: 'Intramuros Campus',
        course: 'BS Civil Engineering',
        role: 'student',
        color: '#D71920'
      },
      {
        fullName: 'Joanah Bautista',
        email: 'joanah.bautista@mymail.mapua.edu.ph',
        campus: 'Makati Campus',
        course: 'BS Information Technology',
        role: 'student',
        color: '#2563EB'
      },
      {
        fullName: 'Marketplace Admin',
        email: 'julienicolas@mymail.mapua.edu.ph',
        campus: 'Makati Campus',
        course: 'Mapúa Marketplace Team',
        role: 'admin',
        color: '#111827'
      }
    ];

    for (const user of demoUsers) {
      await pool.query(
        `
        INSERT INTO users
        (
          full_name,
          email,
          password_hash,
          campus,
          course,
          role,
          avatar_color
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)

        ON DUPLICATE KEY UPDATE
          full_name = VALUES(full_name),
          password_hash = VALUES(password_hash),
          campus = VALUES(campus),
          course = VALUES(course),
          role = VALUES(role),
          avatar_color = VALUES(avatar_color),
          is_active = 1
        `,
        [
          user.fullName,
          user.email,
          passwordHash,
          user.campus,
          user.course,
          user.role,
          user.color
        ]
      );
    }

    // --------------------------------------------------
    // GET USER IDS
    // --------------------------------------------------

    const demoEmails = demoUsers.map(user => user.email);

    const [users] = await pool.query(
      `
      SELECT id, email
      FROM users
      WHERE email IN (?, ?, ?)
      `,
      demoEmails
    );

    const userIds = {};

    for (const user of users) {
      userIds[user.email] = user.id;
    }

    console.log('Demo user IDs:', userIds);

    // --------------------------------------------------
    // GET CATEGORY IDS
    // --------------------------------------------------

    const [categories] = await pool.query(
      'SELECT id, slug FROM categories'
    );

    const categoryIds = {};

    for (const category of categories) {
      categoryIds[category.slug] = category.id;
    }

    console.log('Categories found:', categoryIds);

    // --------------------------------------------------
    // REMOVE OLD DEMO LISTINGS
    // --------------------------------------------------

    await pool.query(
      `DELETE FROM listings WHERE title LIKE '[DEMO]%'`
    );

    // --------------------------------------------------
    // SAMPLE LISTINGS
    // --------------------------------------------------

    const listings = [
      {
        seller: 'reign.torre@mymail.mapua.edu.ph',
        category: 'textbooks',
        title: '[DEMO] Engineering Mathematics 7th Edition',
        description:
          'Used for one semester. Pages are complete with only a few highlighted sections. Good for engineering students.',
        price: 650,
        condition: 'Good',
        meetup: 'Intramuros Campus'
      },

      {
        seller: 'joanah.bautista@mymail.mapua.edu.ph',
        category: 'engineering-tools',
        title: '[DEMO] Casio FX-991EX Scientific Calculator',
        description:
          'Fully working scientific calculator with original hard cover. Selling because I upgraded to another model.',
        price: 850,
        condition: 'Like New',
        meetup: 'Either Campus'
      },

      {
        seller: 'reign.torre@mymail.mapua.edu.ph',
        category: 'drafting-materials',
        title: '[DEMO] Rotring Technical Pen Set',
        description:
          'Technical pen set used for drafting plates. All pens are still working and stored in the original case.',
        price: 700,
        condition: 'Good',
        meetup: 'Intramuros Campus'
      },

      {
        seller: 'reign.torre@mymail.mapua.edu.ph',
        category: 'engineering-tools',
        title: '[DEMO] 24-inch T-Square',
        description:
          'Still straight and in good condition. Perfect for manual drafting activities and plates.',
        price: 280,
        condition: 'Good',
        meetup: 'Intramuros Campus'
      },

      {
        seller: 'joanah.bautista@mymail.mapua.edu.ph',
        category: 'uniforms',
        title: '[DEMO] Mapúa PE Uniform',
        description:
          'Complete PE uniform set. Size medium. Used only a few times and still in very good condition.',
        price: 450,
        condition: 'Like New',
        meetup: 'Makati Campus'
      },

      {
        seller: 'joanah.bautista@mymail.mapua.edu.ph',
        category: 'electronics',
        title: '[DEMO] Logitech Wireless Mouse',
        description:
          'Compact wireless mouse suitable for laptop work and programming classes. USB receiver included.',
        price: 400,
        condition: 'Good',
        meetup: 'Makati Campus'
      },

      {
        seller: 'reign.torre@mymail.mapua.edu.ph',
        category: 'school-essentials',
        title: '[DEMO] Scientific Notebook Bundle',
        description:
          'Five unused notebooks. Selling them together because I bought too many before the semester started.',
        price: 250,
        condition: 'New',
        meetup: 'Either Campus'
      },

      {
        seller: 'joanah.bautista@mymail.mapua.edu.ph',
        category: 'textbooks',
        title: '[DEMO] Introduction to Programming Book',
        description:
          'Beginner programming textbook covering variables, loops, functions, arrays, and object-oriented concepts.',
        price: 500,
        condition: 'Good',
        meetup: 'Makati Campus'
      }
    ];

    // --------------------------------------------------
    // INSERT LISTINGS
    // --------------------------------------------------

    for (const listing of listings) {
      const sellerId = userIds[listing.seller];
      const categoryId = categoryIds[listing.category];

      if (!sellerId) {
        throw new Error(
          `Could not find seller ID for ${listing.seller}`
        );
      }

      if (!categoryId) {
        throw new Error(
          `Could not find category: ${listing.category}`
        );
      }

      await pool.query(
        `
        INSERT INTO listings
        (
          seller_id,
          category_id,
          title,
          description,
          price,
          item_condition,
          meetup_location,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Available')
        `,
        [
          sellerId,
          categoryId,
          listing.title,
          listing.description,
          listing.price,
          listing.condition,
          listing.meetup
        ]
      );
    }

    console.log('');
    console.log('====================================');
    console.log('Demo data added successfully!');
    console.log('====================================');

    console.log('');
    console.log('STUDENT 1');
    console.log('Email: reign.torre@mymail.mapua.edu.ph');
    console.log('Password: Demo123!');

    console.log('');
    console.log('STUDENT 2');
    console.log('Email: joanah.bautista@mymail.mapua.edu.ph');
    console.log('Password: Demo123!');

    console.log('');
    console.log('ADMIN');
    console.log('Email: julienicolas@mymail.mapua.edu.ph');
    console.log('Password: Demo123!');

    console.log('');
  } catch (error) {
    console.error('Seed failed:');
    console.error(error);
  } finally {
    await pool.end();
  }
}

seed();