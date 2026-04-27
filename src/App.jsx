import { useState } from 'react';
import Header from './components/Header';
import RecordForm from './components/RecordForm';
import RecordList from './components/RecordList';
import Statistics from './components/Statistics';
import ManageItems from './components/ManageItems';
import { useRecords } from './hooks/useRecords';
import { useCategories } from './hooks/useCategories';
import { useTags } from './hooks/useTags';

export default function App() {
  const [activeTab, setActiveTab] = useState('add');
  const [manageType, setManageType] = useState(null); // 'categories-expense' | 'categories-income' | 'tags'

  const { records, addRecord, updateRecord, deleteRecord } = useRecords();
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesByType,
  } = useCategories();
  const { tags, addTag, updateTag, deleteTag } = useTags();

  const handleManageCategories = () => {
    setManageType('categories-expense');
  };

  const handleManageTags = () => {
    setManageType('tags');
  };

  const closeManage = () => {
    setManageType(null);
  };

  const getManageItems = () => {
    if (manageType === 'tags') {
      return {
        title: '管理标签',
        items: tags,
        onAdd: addTag,
        onUpdate: updateTag,
        onDelete: deleteTag,
      };
    }
    if (manageType === 'categories-expense') {
      return {
        title: '管理支出分类',
        items: getCategoriesByType('expense'),
        onAdd: (name) => addCategory(name, 'expense'),
        onUpdate: updateCategory,
        onDelete: deleteCategory,
      };
    }
    if (manageType === 'categories-income') {
      return {
        title: '管理收入分类',
        items: getCategoriesByType('income'),
        onAdd: (name) => addCategory(name, 'income'),
        onUpdate: updateCategory,
        onDelete: deleteCategory,
      };
    }
    return null;
  };

  const manageProps = getManageItems();

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'add' && (
        <RecordForm
          categories={categories}
          tags={tags}
          onSubmit={(data) => { addRecord(data); setActiveTab('list'); }}
          onManageCategories={handleManageCategories}
          onManageTags={handleManageTags}
        />
      )}

      {activeTab === 'list' && (
        <RecordList
          records={records}
          categories={categories}
          tags={tags}
          onUpdate={updateRecord}
          onDelete={deleteRecord}
          onManageCategories={handleManageCategories}
          onManageTags={handleManageTags}
        />
      )}

      {activeTab === 'stats' && (
        <Statistics records={records} />
      )}

      {manageProps && (
        <ManageItems
          open={true}
          title={manageProps.title}
          items={manageProps.items}
          onClose={closeManage}
          onAdd={manageProps.onAdd}
          onUpdate={manageProps.onUpdate}
          onDelete={manageProps.onDelete}
        />
      )}
    </>
  );
}
