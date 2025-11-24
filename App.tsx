import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';

/* Tipos simples */
type Product = {
  id: number;
  name: string;
  qty: number;
  category?: string;
  price?: number;
  minQty?: number;
  createdAt: number;
};

type Supplier = {
  id: number;
  name: string;
  phone?: string;
  createdAt: number;
};

type RepairStatus = 'Pendente' | 'Em Progresso' | 'Concluído';
type Repair = {
  id: number;
  customer?: string;
  phoneModel: string;
  problem: string;
  status: RepairStatus;
  technician?: string;
  estimate?: number;
  createdAt: number;
};

type StockMove = {
  id: number;
  productId: number;
  delta: number;
  reason: string;
  date: number;
};

/* Tema azul suave (substituir o tema antigo por este) */
const theme = {
  colors: {
    primary: '#4FC3F7',     // cor principal clara (usada antes como "gold")
    primaryDark: '#0288D1',
    background: '#061826',  // fundo escuro azulado
    surface: '#0B2735',     // blocos/tile
    surfaceSoft: '#0F3646', // cartões/aviso
    textLight: '#E6F7FF',   // texto claro
    mutedPrimary: 'rgba(79,195,247,0.85)',
    border: '#4FC3F7',
    danger: '#FF6B6B',
  },
  spacing: { xs: 6, sm: 8, md: 16, lg: 24 },
  radius: { sm: 6, md: 12, lg: 16 },
};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// reservar uma altura fixa para o grid dos tiles (ajuste se quiser mais/menos)
const GRID_HEIGHT = Math.floor(SCREEN_H * 0.44);
// Forçar 2 colunas (quadriculado 2x2) e sem espaço lateral
const NUM_COLS = 2;
const GRID_GAP = 0;
const TILE_PERCENT = '50%';

export default function App() {
  const [screen, setScreen] = useState<'dashboard' | 'produtos' | 'estoque' | 'fornecedores' | 'conserto'>('dashboard');

  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [stockMoves, setStockMoves] = useState<StockMove[]>([]);

  // modal/forms
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'product-add' | 'supplier-add' | 'repair-add' | 'stock-add' | 'quick-action' | null>(null);
  const [formName, setFormName] = useState('');
  const [formQty, setFormQty] = useState('1');
  const [formPhoneModel, setFormPhoneModel] = useState('');
  const [formProblem, setFormProblem] = useState('');
  const [formRepairEstimate, setFormRepairEstimate] = useState('');
  const [formStockProductId, setFormStockProductId] = useState('');
  const [formStockQty, setFormStockQty] = useState('1');
  const [formStockReason, setFormStockReason] = useState('Entrada manual');

  useEffect(() => {
    // dados iniciais leves
    if (products.length === 0 && suppliers.length === 0 && repairs.length === 0) {
      const now = Date.now();
      const s1: Supplier = { id: 1, name: 'Fornecedor A', phone: '1199999', createdAt: now - 500000 };
      const s2: Supplier = { id: 2, name: 'Fornecedor B', phone: '1188888', createdAt: now - 400000 };
      const p1: Product = { id: 101, name: 'Tela iPhone X', qty: 5, category: 'Telas', price: 120, minQty: 3, createdAt: now - 300000 };
      const p2: Product = { id: 102, name: 'Bateria Genérica', qty: 15, category: 'Baterias', price: 25, minQty: 5, createdAt: now - 200000 };
      const r1: Repair = { id: 201, customer: 'João', phoneModel: 'iPhone X', problem: 'Tela trincada', status: 'Pendente', technician: 'Carlos', estimate: 150, createdAt: now - 150000 };
      setSuppliers([s1, s2]);
      setProducts([p1, p2]);
      setRepairs([r1]);
    }
  }, []);

  /* Funções básicas */
  const openModal = (mode: typeof modalMode) => {
    setModalMode(mode);
    setModalVisible(true);
  };

  const addProduct = () => {
    if (!formName.trim()) return Alert.alert('Aviso', 'Nome do produto obrigatório');
    const p: Product = { id: Date.now(), name: formName.trim(), qty: Number(formQty) || 0, createdAt: Date.now() };
    setProducts((s) => [p, ...s]);
    setFormName(''); setFormQty('1'); setModalVisible(false);
  };

  const addSupplier = () => {
    if (!formName.trim()) return Alert.alert('Aviso', 'Nome do fornecedor obrigatório');
    const s: Supplier = { id: Date.now(), name: formName.trim(), createdAt: Date.now() };
    setSuppliers((x) => [s, ...x]);
    setFormName(''); setModalVisible(false);
  };

  const addRepair = () => {
    if (!formPhoneModel.trim()) return Alert.alert('Aviso', 'Modelo obrigatório');
    const r: Repair = {
      id: Date.now(),
      customer: formName.trim() || 'Cliente',
      phoneModel: formPhoneModel.trim(),
      problem: formProblem.trim() || '-',
      status: 'Pendente',
      technician: 'Técnico',
      estimate: Number(formRepairEstimate) || undefined,
      createdAt: Date.now(),
    };
    setRepairs((s) => [r, ...s]);
    setFormName(''); setFormPhoneModel(''); setFormProblem(''); setFormRepairEstimate(''); setModalVisible(false);
  };

  const addStockMove = () => {
    const pid = Number(formStockProductId);
    const qty = Number(formStockQty) || 0;
    if (!pid || qty === 0) return Alert.alert('Aviso', 'Informe ID do produto e quantidade diferente de zero');
    const prod = products.find((p) => p.id === pid);
    if (!prod) return Alert.alert('Erro', 'Produto não encontrado');
    setProducts((list) => list.map((p) => (p.id === pid ? { ...p, qty: Math.max(0, p.qty + qty) } : p)));
    const move: StockMove = { id: Date.now(), productId: pid, delta: qty, reason: formStockReason || 'Ajuste', date: Date.now() };
    setStockMoves((m) => [move, ...m]);
    setFormStockProductId(''); setFormStockQty('1'); setFormStockReason('Entrada manual'); setModalVisible(false);
  };

  const changeRepairStatus = (id: number, next: RepairStatus) => {
    setRepairs((list) => list.map((r) => (r.id === id ? { ...r, status: next } : r)));
  };

  const exportStockCSV = () => {
    const csv = stockMoves.map((m) => `${m.id},${m.productId},${m.delta},"${m.reason}",${new Date(m.date).toISOString()}`).join('\n');
    Alert.alert('CSV', csv || 'Sem movimentos');
  };

  /* Helpers para avisos */
  const lowStockItems = products.filter((p) => p.minQty != null && p.qty <= (p.minQty ?? 0));
  const buySoonItems = products.filter((p) => p.qty <= 10);
  const pendingRepairs = repairs.filter((r) => r.status !== 'Concluído');
  const notificationCount = lowStockItems.length + pendingRepairs.length;

  /* Small UI atoms */
  const Header = () => (
    <View style={styles.headerRowCompact}>
      <View>
        <Text style={styles.titleCompact}>DALMOS ACESSÓRIOS</Text>
        <Text style={styles.subtitleCompact}>Painel</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => Alert.alert('Notificações', `Itens com atenção: ${notificationCount}`)}>
          <Text style={styles.iconText}>🔔</Text>
          {notificationCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{notificationCount}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => openModal('quick-action')}>
          <Text style={styles.iconText}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  /* Dashboard */
  const Dashboard = () => {
    const totalValue = products.reduce((s, p) => s + ((p.price || 0) * p.qty), 0);
    const lowNames = lowStockItems.slice(0, 3).map((p) => p.name).join(', ');
    const buySoonNames = buySoonItems.slice(0, 3).map((p) => p.name).join(', ');
    const oldestPending = pendingRepairs.length ? pendingRepairs.reduce((a, b) => (a.createdAt < b.createdAt ? a : b)) : null;
    const oldestPendingDays = oldestPending ? Math.floor((Date.now() - oldestPending.createdAt) / (1000 * 60 * 60 * 24)) : 0;

    return (
      <ScrollView style={styles.section} contentContainerStyle={{ paddingTop: theme.spacing.xs, paddingBottom: 40 }}>
        <Header />

        <View style={styles.stats}>
          <View style={styles.statItem}><Text style={styles.statValue}>{products.length}</Text><Text style={styles.statLabel}>Produtos</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{suppliers.length}</Text><Text style={styles.statLabel}>Fornecedores</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>{pendingRepairs.length}</Text><Text style={styles.statLabel}>Consertos</Text></View>
          <View style={styles.statItem}><Text style={styles.statValue}>R$ {totalValue.toFixed(2)}</Text><Text style={styles.statLabel}>Valor estoque</Text></View>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={[styles.tile, styles.tileTL]} onPress={() => setScreen('produtos')}>
            <View style={styles.tileContent}>
              <Text style={styles.tileIcon}>📦</Text>
              <Text style={styles.tileLabel}>PRODUTOS</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tile, styles.tileTR]} onPress={() => setScreen('estoque')}>
            <View style={styles.tileContent}>
              <Text style={styles.tileIcon}>🏷️</Text>
              <Text style={styles.tileLabel}>ESTOQUE{lowStockItems.length ? ` • ${lowStockItems.length}` : ''}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tile, styles.tileBL]} onPress={() => setScreen('fornecedores')}>
            <View style={styles.tileContent}>
              <Text style={styles.tileIcon}>🏢</Text>
              <Text style={styles.tileLabel}>FORNECEDORES</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.tile, styles.tileBR]} onPress={() => setScreen('conserto')}>
            <View style={styles.tileContent}>
              <Text style={styles.tileIcon}>🔧</Text>
              <Text style={styles.tileLabel}>CONSERTO</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* avisos empilhados */}
        <View style={styles.warningsRow}>
          <View style={styles.warningCard}>
            <Text style={styles.warningCardTitle}>Estoque crítico</Text>
            {lowStockItems.length ? (
              <>
                <Text style={styles.warningText}>⚠️ {lowStockItems.length} produto(s)</Text>
                {lowNames ? <Text style={styles.warningSubText}>{lowNames}{lowStockItems.length > 3 ? '...' : ''}</Text> : null}
              </>
            ) : <Text style={styles.okText}>✅ Nenhum item crítico</Text>}
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningCardTitle}>Repor em breve</Text>
            {buySoonItems.length ? (
              <>
                <Text style={styles.warningText}>🔔 {buySoonItems.length} item(s) com qty ≤ 10</Text>
                {buySoonNames ? <Text style={styles.warningSubText}>{buySoonNames}{buySoonItems.length > 3 ? '...' : ''}</Text> : null}
              </>
            ) : <Text style={styles.okText}>✅ Níveis aceitáveis</Text>}
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningCardTitle}>Consertos</Text>
            {pendingRepairs.length ? (
              <>
                <Text style={styles.warningText}>🔧 {pendingRepairs.length} pendente(s)</Text>
                {oldestPending ? <Text style={styles.warningSubText}>Mais antigo: {oldestPendingDays} dia(s)</Text> : null}
              </>
            ) : <Text style={styles.okText}>✅ Nenhum pendente</Text>}
          </View>
        </View>

        {/* quick actions (baixo) */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => openModal('product-add')}><Text style={styles.quickBtnText}>+ Produto</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => openModal('stock-add')}><Text style={styles.quickBtnText}>Ajustar Estoque</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => Alert.alert('Pedido', 'Criar ordem de compra (placeholder)')}><Text style={styles.quickBtnText}>Ordem Compra</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => Alert.alert('Scan', 'Abrir scanner (placeholder)')}><Text style={styles.quickBtnText}>Scan</Text></TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  /* telas listadas (sem mudanças funcionais) */
  const ProdutosScreen = () => (
    <View style={styles.section}>
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setScreen('dashboard')}><Text style={styles.buttonTextSecondary}>VOLTAR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => openModal('product-add')}><Text style={styles.buttonText}>NOVO PRODUTO</Text></TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={{ paddingBottom: 80 }}
        data={products}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum produto</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemText}>Qtd: <Text style={styles.goldText}>{item.qty}</Text> • R$ <Text style={styles.goldText}>{item.price ?? '-'}</Text></Text>
            </View>
            <View style={{ width: 120 }}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setFormName(item.name); setFormQty(String(item.qty)); openModal('product-add'); }}><Text style={styles.actionBtnText}>Editar</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );

  const EstoqueScreen = () => (
    <View style={styles.section}>
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setScreen('dashboard')}><Text style={styles.buttonTextSecondary}>VOLTAR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => openModal('stock-add')}><Text style={styles.buttonText}>ADICIONAR/ AJUSTAR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => exportStockCSV()}><Text style={styles.buttonTextSecondary}>EXPORTAR MOVS</Text></TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={{ paddingBottom: 80 }}
        data={products}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum produto cadastrado</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemText}>Qtd: <Text style={styles.goldText}>{item.qty}</Text> {item.minQty != null && item.qty <= (item.minQty ?? 0) ? <Text style={styles.bad}> • Baixo!</Text> : null}</Text>
            </View>
            <View style={{ width: 140 }}>
              <TouchableOpacity style={styles.smallPrimary} onPress={() => { setFormStockProductId(String(item.id)); setFormStockQty('1'); setFormStockReason('Entrada manual'); openModal('stock-add'); }}><Text style={styles.smallPrimaryText}>+ ENTRADA</Text></TouchableOpacity>
              <View style={{ height: 8 }} />
              <TouchableOpacity style={styles.smallSecondary} onPress={() => { setFormStockProductId(String(item.id)); setFormStockQty('-1'); setFormStockReason('Saída manual'); openModal('stock-add'); }}><Text style={styles.smallSecondaryText}>- SAÍDA</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Text style={styles.sectionNote}>Movimentações recentes</Text>
      <FlatList
        contentContainerStyle={{ paddingBottom: 120 }}
        data={stockMoves}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma movimentação</Text>}
        renderItem={({ item }) => {
          const p = products.find((x) => x.id === item.productId);
          return (
            <View style={styles.moveItem}>
              <Text style={styles.itemText}>{p ? p.name : `Produto ${item.productId}`} — {item.delta > 0 ? `Entrada +${item.delta}` : `Saída ${item.delta}`}</Text>
              <Text style={styles.itemTextSmall}>{new Date(item.date).toLocaleString()} — {item.reason}</Text>
            </View>
          );
        }}
      />
    </View>
  );

  const FornecedoresScreen = () => (
    <View style={styles.section}>
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setScreen('dashboard')}><Text style={styles.buttonTextSecondary}>VOLTAR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => openModal('supplier-add')}><Text style={styles.buttonText}>NOVO FORNECEDOR</Text></TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={{ paddingBottom: 80 }}
        data={suppliers}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum fornecedor</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <Text style={styles.itemText}>{item.phone ?? '-'}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );

  const ConsertoScreen = () => (
    <View style={styles.section}>
      <View style={styles.rowButtons}>
        <TouchableOpacity style={styles.buttonSecondary} onPress={() => setScreen('dashboard')}><Text style={styles.buttonTextSecondary}>VOLTAR</Text></TouchableOpacity>
        <TouchableOpacity style={styles.buttonPrimary} onPress={() => openModal('repair-add')}><Text style={styles.buttonText}>NOVO CONSERTO</Text></TouchableOpacity>
      </View>

      <FlatList
        contentContainerStyle={{ paddingBottom: 80 }}
        data={repairs}
        keyExtractor={(i) => String(i.id)}
        ListEmptyComponent={<Text style={styles.empty}>Nenhum registro de conserto</Text>}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.phoneModel} — <Text style={styles.tag}>{item.status}</Text></Text>
              <Text style={styles.itemText}>Cliente: {item.customer ?? '-'}</Text>
              <Text style={styles.itemText}>Estimativa: <Text style={styles.goldText}>{item.estimate != null ? `R$ ${item.estimate}` : '-'}</Text></Text>
            </View>
            <View style={{ width: 120 }}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => changeRepairStatus(item.id, item.status === 'Pendente' ? 'Em Progresso' : item.status === 'Em Progresso' ? 'Concluído' : 'Pendente')}><Text style={styles.actionBtnText}>Alterar</Text></TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );

  /* Modal content renderer */
  const renderModalContent = () => {
    if (modalMode === 'product-add') {
      return (
        <>
          <Text style={styles.modalTitle}>Adicionar / Editar Produto</Text>
          <TextInput placeholder="Nome" placeholderTextColor={theme.colors.mutedPrimary} value={formName} onChangeText={setFormName} style={styles.input} />
          <TextInput placeholder="Quantidade" placeholderTextColor={theme.colors.mutedPrimary} value={formQty} onChangeText={setFormQty} keyboardType="numeric" style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <TouchableOpacity style={styles.buttonPrimary} onPress={addProduct}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => setModalVisible(false)}><Text style={styles.buttonTextSecondary}>Cancelar</Text></TouchableOpacity>
          </View>
        </>
      );
    }
    if (modalMode === 'supplier-add') {
      return (
        <>
          <Text style={styles.modalTitle}>Adicionar Fornecedor</Text>
          <TextInput placeholder="Nome" placeholderTextColor={theme.colors.mutedPrimary} value={formName} onChangeText={setFormName} style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <TouchableOpacity style={styles.buttonPrimary} onPress={addSupplier}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => setModalVisible(false)}><Text style={styles.buttonTextSecondary}>Cancelar</Text></TouchableOpacity>
          </View>
        </>
      );
    }
    if (modalMode === 'repair-add') {
      return (
        <>
          <Text style={styles.modalTitle}>Novo Conserto</Text>
          <TextInput placeholder="Cliente" placeholderTextColor={theme.colors.mutedPrimary} value={formName} onChangeText={setFormName} style={styles.input} />
          <TextInput placeholder="Modelo" placeholderTextColor={theme.colors.mutedPrimary} value={formPhoneModel} onChangeText={setFormPhoneModel} style={styles.input} />
          <TextInput placeholder="Problema" placeholderTextColor={theme.colors.mutedPrimary} value={formProblem} onChangeText={setFormProblem} style={[styles.input, { height: 80 }]} multiline />
          <TextInput placeholder="Estimativa" placeholderTextColor={theme.colors.mutedPrimary} value={formRepairEstimate} onChangeText={setFormRepairEstimate} keyboardType="numeric" style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <TouchableOpacity style={styles.buttonPrimary} onPress={addRepair}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => setModalVisible(false)}><Text style={styles.buttonTextSecondary}>Cancelar</Text></TouchableOpacity>
          </View>
        </>
      );
    }
    if (modalMode === 'stock-add') {
      return (
        <>
          <Text style={styles.modalTitle}>Ajustar Estoque</Text>
          <TextInput placeholder="Product ID" placeholderTextColor={theme.colors.mutedPrimary} value={formStockProductId} onChangeText={setFormStockProductId} keyboardType="numeric" style={styles.input} />
          <TextInput placeholder="Quantidade (+ entrada, - saída)" placeholderTextColor={theme.colors.mutedPrimary} value={formStockQty} onChangeText={setFormStockQty} keyboardType="numeric" style={styles.input} />
          <TextInput placeholder="Motivo" placeholderTextColor={theme.colors.mutedPrimary} value={formStockReason} onChangeText={setFormStockReason} style={styles.input} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <TouchableOpacity style={styles.buttonPrimary} onPress={addStockMove}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.buttonSecondary} onPress={() => setModalVisible(false)}><Text style={styles.buttonTextSecondary}>Cancelar</Text></TouchableOpacity>
          </View>
        </>
      );
    }
    if (modalMode === 'quick-action') {
      return (
        <>
          <Text style={styles.modalTitle}>Ações rápidas</Text>
          <TouchableOpacity style={styles.buttonPrimary} onPress={() => { setModalVisible(false); openModal('product-add'); }}><Text style={styles.buttonText}>Novo Produto</Text></TouchableOpacity>
          <View style={{ height: 10 }} />
          <TouchableOpacity style={styles.buttonPrimary} onPress={() => { setModalVisible(false); openModal('stock-add'); }}><Text style={styles.buttonText}>Ajustar Estoque</Text></TouchableOpacity>
          <View style={{ height: 10 }} />
          <TouchableOpacity style={styles.buttonSecondary} onPress={() => { setModalVisible(false); Alert.alert('Ordem', 'Criar ordem de compra (placeholder)'); }}><Text style={styles.buttonTextSecondary}>Criar Ordem de Compra</Text></TouchableOpacity>
        </>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      {screen === 'dashboard' && <Dashboard />}
      {screen === 'produtos' && <ProdutosScreen />}
      {screen === 'estoque' && <EstoqueScreen />}
      {screen === 'fornecedores' && <FornecedoresScreen />}
      {screen === 'conserto' && <ConsertoScreen />}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => openModal('quick-action')}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
            <View style={styles.modal}>
              {renderModalContent()}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* Estilos melhorados */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  headerRowCompact: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xs, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  titleCompact: { color: theme.colors.primary, fontSize: 22, fontWeight: '700' },
  subtitleCompact: { color: theme.colors.mutedPrimary, fontSize: 13, fontWeight: '400' },
  iconBtn: { marginLeft: 8, padding: 8, borderRadius: 8 },
  iconText: { fontSize: 20 },
  badge: { position: 'absolute', right: 2, top: -4, backgroundColor: theme.colors.danger, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  section: { flex: 1, paddingHorizontal: theme.spacing.lg, paddingTop: 0 },
  stats: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: theme.colors.primary, fontSize: 20, fontWeight: '800' },
  statLabel: { color: theme.colors.mutedPrimary, fontSize: 13, marginTop: 6 },

  /* grid: força altura do container e tiles ocupando 50% da altura cada (2 linhas) */
  grid: {
    height: GRID_HEIGHT,            // ocupa parte da tela para eliminar espaço abaixo
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 0,
    marginTop: theme.spacing.xs,
  },

  /* ajustes para ícone/texto dos tiles */
  tile: {
    width: '50%',
    height: '50%',
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    margin: 0,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },

  tileContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center', // centraliza verticalmente
    alignItems: 'center',     // centraliza horizontalmente
    paddingHorizontal: 8,
  },

  tileIcon: {
    fontSize: 52,                    // ícone maior
    lineHeight: 56,
    textAlign: 'center',
    marginBottom: 8,
    color: theme.colors.primary,     // cor visível
  },

  tileLabel: {
    color: theme.colors.textLight,   // texto claro para melhor contraste
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
    letterSpacing: 0.6,
  },

  warningsRow: { marginTop: theme.spacing.xs }, // aproxima avisos dos tiles
  warningCard: {
    width: '100%',
    minHeight: 84,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs,
    justifyContent: 'center',
  },
  warningCardTitle: { color: theme.colors.primary, fontWeight: '900', marginBottom: 6, fontSize: 14 },
  warningText: { color: theme.colors.primary, fontWeight: '800', marginBottom: 6, fontSize: 14 },
  warningSubText: { color: theme.colors.mutedPrimary, fontSize: 13, marginTop: 4 },
  okText: { color: theme.colors.mutedPrimary, fontSize: 13 },

  quickActions: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.md, flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm, flexWrap: 'wrap' },
  quickBtn: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: 12, paddingHorizontal: 14, borderRadius: theme.radius.sm, flex: 1, alignItems: 'center', marginRight: 8, minWidth: 120 },
  quickBtnText: { color: theme.colors.primary, fontWeight: '800' },

  rowButtons: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingVertical: theme.spacing.sm, gap: theme.spacing.xs, flexWrap: 'wrap' },

  item: {
    flexDirection: 'row',
    padding: 18,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 14,
    alignItems: 'center',
    width: '100%',
  },
  itemTitle: { color: theme.colors.primary, fontWeight: '800', fontSize: 18, marginBottom: 6 },
  itemText: { color: theme.colors.mutedPrimary, fontSize: 15 },
  itemTextSmall: { color: theme.colors.mutedPrimary, fontSize: 13 },
  tag: { color: theme.colors.primary, fontWeight: '800' },
  empty: { color: theme.colors.mutedPrimary, textAlign: 'center', marginTop: 28, fontSize: 16 },

  /* ===== ADICIONADO: estilos de botões principais ===== */
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    minHeight: 44,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 110,
    minHeight: 44,
  },
  buttonText: { color: theme.colors.textLight, fontWeight: '900', fontSize: 15, textAlign: 'center' },
  buttonTextSecondary: { color: theme.colors.primary, fontWeight: '900', fontSize: 15, textAlign: 'center' },

  actionBtn: { backgroundColor: theme.colors.surfaceSoft, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: theme.colors.primary, alignItems: 'center' },
  actionBtnText: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },

  smallPrimary: { backgroundColor: theme.colors.primary, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center' },
  smallPrimaryText: { color: theme.colors.textLight, fontWeight: '800', fontSize: 14 },
  smallSecondary: { backgroundColor: 'transparent', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.primary },
  smallSecondaryText: { color: theme.colors.primary, fontWeight: '800', fontSize: 14 },

  goldText: { color: theme.colors.primary, fontWeight: '800', fontSize: 15 },
  bad: { color: theme.colors.danger, fontWeight: '800', fontSize: 14 },

  // melhorar visibilidade do botão VOLTAR
  backButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 14, borderRadius: theme.radius.sm, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  backButtonText: { color: theme.colors.primary, fontWeight: '900', fontSize: 15 },

  fab: { position: 'absolute', right: 18, bottom: 18, width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabText: { color: theme.colors.textLight, fontSize: 28, fontWeight: '900' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center' },
  modal: { backgroundColor: theme.colors.surface, marginHorizontal: 20, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
  modalTitle: { color: theme.colors.primary, fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: theme.spacing.md },
  input: { backgroundColor: '#111', borderWidth: 1, borderColor: theme.colors.border, color: theme.colors.textLight, padding: 12, borderRadius: theme.radius.sm, marginBottom: theme.spacing.sm, fontSize: 15 },
});