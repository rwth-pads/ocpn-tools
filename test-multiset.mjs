// Test the multiset parser logic

function skipBracketedExpr(s, pos, open, close) {
  let depth = 0;
  while (pos < s.length) {
    if (s[pos] === '"') {
      pos++;
      while (pos < s.length && s[pos] !== '"') {
        if (s[pos] === '\\') pos++;
        pos++;
      }
      if (pos < s.length) pos++;
    } else if (s[pos] === open) {
      depth++;
      pos++;
    } else if (s[pos] === close) {
      depth--;
      pos++;
      if (depth === 0) break;
    } else {
      pos++;
    }
  }
  return pos;
}

function parseSMLMultiset(expr) {
  const s = expr.trim();
  if (!/\d+`/.test(s)) return null;
  const tokens = [];
  let pos = 0;
  while (pos < s.length) {
    while (pos < s.length && /\s/.test(s[pos])) pos++;
    if (pos >= s.length) break;
    if (s.startsWith('++', pos)) {
      pos += 2;
      while (pos < s.length && /\s/.test(s[pos])) pos++;
      if (pos >= s.length) break;
    }
    const multMatch = s.slice(pos).match(/^(\d+)`/);
    if (!multMatch) return null;
    const count = parseInt(multMatch[1], 10);
    pos += multMatch[0].length;
    const valueStart = pos;
    if (s[pos] === '"') {
      pos++;
      while (pos < s.length && s[pos] !== '"') { if (s[pos] === '\\') pos++; pos++; }
      if (pos < s.length) pos++;
    } else if (s[pos] === '(') {
      pos = skipBracketedExpr(s, pos, '(', ')');
    } else if (s[pos] === '[') {
      pos = skipBracketedExpr(s, pos, '[', ']');
    } else if (s[pos] === '{') {
      pos = skipBracketedExpr(s, pos, '{', '}');
    } else {
      while (pos < s.length && !/\s/.test(s[pos]) && !s.startsWith('++', pos)) pos++;
    }
    const value = s.slice(valueStart, pos).trim();
    if (!value) return null;
    tokens.push({ count, value });
  }
  return tokens.length > 0 ? tokens : null;
}

function splitTupleComponents(inner) {
  const components = [];
  let current = '';
  let depth = 0;
  let inString = false;
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (inString) {
      current += ch;
      if (ch === '\\' && i + 1 < inner.length) { current += inner[++i]; }
      else if (ch === '"') { inString = false; }
    } else if (ch === '"') {
      inString = true; current += ch;
    } else if (ch === '(' || ch === '[' || ch === '{') {
      depth++; current += ch;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--; current += ch;
    } else if (ch === ',' && depth === 0) {
      components.push(current); current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) components.push(current);
  return components;
}

function translateSMLTokenValue(value) {
  const v = value.trim();
  if (v.startsWith('"') && v.endsWith('"')) return v;
  if (v.startsWith('(') && v.endsWith(')')) {
    const inner = v.slice(1, -1);
    const components = splitTupleComponents(inner);
    const translated = components.map(c => translateSMLTokenValue(c.trim()));
    return `[${translated.join(', ')}]`;
  }
  if (v.startsWith('[') && v.endsWith(']')) return v;
  if (/^-?\d+(\.\d+)?$/.test(v)) return v;
  if (v === 'true' || v === 'false') return v;
  if (v === '()') return '()';
  return v;
}

// Test 1: Simple strings (as they'd come from XML, with actual newline)
const t1 = '1`"Dan Brown"++\n1`"John Grisham"';
console.log('Test 1 parse:', JSON.stringify(parseSMLMultiset(t1)));
const tokens1 = parseSMLMultiset(t1);
if (tokens1) {
  const result = tokens1.flatMap(({count, value}) => 
    Array(count).fill(translateSMLTokenValue(value)));
  console.log('Test 1 result:', `[${result.join(', ')}]`);
}

// Test 2: Product tuples
const t2 = '1`("Dan Brown","De Da Vinci code") ++\n1`("Dan Brown","Het Bernini mysterie") ++\n1`("Dan Brown","Het Juvenalis Dilemma") ++\n1`("John Grisham","The Firm") ++\n1`("John Grisham","The Pelican Brief")';
console.log('\nTest 2 parse:', JSON.stringify(parseSMLMultiset(t2)));
const tokens2 = parseSMLMultiset(t2);
if (tokens2) {
  const result = tokens2.flatMap(({count, value}) => 
    Array(count).fill(translateSMLTokenValue(value)));
  console.log('Test 2 result:', `[${result.join(', ')}]`);
}

// Test 3: Multiplicity > 1
const t3 = '3`5';
console.log('\nTest 3 parse:', JSON.stringify(parseSMLMultiset(t3)));
const tokens3 = parseSMLMultiset(t3);
if (tokens3) {
  const result = tokens3.flatMap(({count, value}) => 
    Array(count).fill(translateSMLTokenValue(value)));
  console.log('Test 3 result:', `[${result.join(', ')}]`);
}

// Test 4: Not a multiset
const t4 = '"just a string"';
console.log('\nTest 4 parse:', JSON.stringify(parseSMLMultiset(t4)));

// Test 5: Single token
const t5 = '1`"Dan Brown"';
console.log('\nTest 5 parse:', JSON.stringify(parseSMLMultiset(t5)));
