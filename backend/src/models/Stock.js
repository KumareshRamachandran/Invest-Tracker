import supabase from '../config/supabase.js';

const Stock = {
  async findAll(options = {}) {
    let query = supabase.from('stocks').select('*');

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          if (Object.prototype.hasOwnProperty.call(value, 'gt')) {
            query = query.gt(key, value.gt);
          } else if (Object.prototype.hasOwnProperty.call(value, 'lt')) {
            query = query.lt(key, value.lt);
          }
        } else {
          query = query.eq(key, value);
        }
      });
    }

    if (options.order) {
      options.order.forEach(([column, direction]) => {
        query = query.order(column, { ascending: direction === 'ASC' });
      });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async findByPk(id) {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return data
      ? {
          ...data,
          update: async (values) => {
            const { data: updatedData, error: updateError } = await supabase
              .from('stocks')
              .update(values)
              .eq('id', id)
              .select()
              .single();

            if (updateError) throw updateError;
            return updatedData;
          },
          destroy: async () => {
            const { error: deleteError } = await supabase
              .from('stocks')
              .delete()
              .eq('id', id);

            if (deleteError) throw deleteError;
            return true;
          }
        }
      : null;
  },

  async create(values) {
    const { data, error } = await supabase
      .from('stocks')
      .insert([values])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async count() {
    const { count, error } = await supabase
      .from('stocks')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }
};

export default Stock;
