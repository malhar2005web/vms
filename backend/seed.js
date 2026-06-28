const { query } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('Seeding initial data...');
  try {
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    const userRes = await query('SELECT * FROM users WHERE username = $1', [adminUsername]);
    if (userRes.rows.length === 0) {
      await query('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)', [
        adminUsername,
        passwordHash,
        'admin'
      ]);
      console.log(`Seeded admin user (Username: ${adminUsername}, Password: ${adminPassword})`);
    } else {
      console.log('Admin user already exists.');
    }

    const defaultUnits = [
      { name: 'Main Head Office', address: '123 Business Park, City Center' },
      { name: 'Manufacturing Unit A', address: 'Industrial Area Phase 2' }
    ];
    let unitIds = [];
    for (const unit of defaultUnits) {
      const res = await query('SELECT id FROM units WHERE name = $1', [unit.name]);
      if (res.rows.length === 0) {
        const insertRes = await query('INSERT INTO units (name, address) VALUES ($1, $2) RETURNING id', [
          unit.name,
          unit.address
        ]);
        unitIds.push(insertRes.rows[0].id);
        console.log(`Seeded unit: ${unit.name}`);
      } else {
        unitIds.push(res.rows[0].id);
      }
    }

    const defaultDepts = ['Human Resources', 'Information Technology', 'Security', 'Sales', 'Finance'];
    let deptIds = [];
    for (const dept of defaultDepts) {
      const res = await query('SELECT id FROM departments WHERE name = $1', [dept]);
      if (res.rows.length === 0) {
        const insertRes = await query('INSERT INTO departments (name) VALUES ($1) RETURNING id', [dept]);
        deptIds.push(insertRes.rows[0].id);
        console.log(`Seeded department: ${dept}`);
      } else {
        deptIds.push(res.rows[0].id);
      }
    }

    const defaultEmployees = [
      { name: 'John Doe', email: 'john.doe@company.com', phone: '9876543210', deptIndex: 0, unitIndex: 0 },
      { name: 'Alice Smith', email: 'alice.smith@company.com', phone: '9876543211', deptIndex: 1, unitIndex: 0 },
      { name: 'Bob Johnson', email: 'bob.johnson@company.com', phone: '9876543212', deptIndex: 3, unitIndex: 1 }
    ];
    for (const emp of defaultEmployees) {
      const deptId = deptIds[emp.deptIndex] || null;
      const unitId = unitIds[emp.unitIndex] || null;
      const res = await query('SELECT id FROM employees WHERE name = $1', [emp.name]);
      if (res.rows.length === 0) {
        await query('INSERT INTO employees (name, email, phone, department_id, unit_id) VALUES ($1, $2, $3, $4, $5)', [
          emp.name,
          emp.email,
          emp.phone,
          deptId,
          unitId
        ]);
        console.log(`Seeded employee: ${emp.name}`);
      }
    }

    const defaultGates = [
      { name: 'Main Reception Gate', unitIndex: 0 },
      { name: 'West Service Entrance', unitIndex: 0 },
      { name: 'Factory Gate 1', unitIndex: 1 }
    ];
    for (const gate of defaultGates) {
      const unitId = unitIds[gate.unitIndex] || null;
      const res = await query('SELECT id FROM gates WHERE name = $1 AND unit_id = $2', [gate.name, unitId]);
      if (res.rows.length === 0) {
        await query('INSERT INTO gates (name, unit_id) VALUES ($1, $2)', [gate.name, unitId]);
        console.log(`Seeded gate: ${gate.name}`);
      }
    }

    const defaultPurposes = ['Interview', 'Official Meeting', 'Delivery/Courier', 'Maintenance/Service', 'Personal Visit'];
    for (const purpose of defaultPurposes) {
      const res = await query('SELECT id FROM purposes WHERE name = $1', [purpose]);
      if (res.rows.length === 0) {
        await query('INSERT INTO purposes (name) VALUES ($1)', [purpose]);
        console.log(`Seeded purpose: ${purpose}`);
      }
    }

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();