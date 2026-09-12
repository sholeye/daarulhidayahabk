import React, { useRef, useState } from 'react';
import { FiCamera, FiLoader } from 'react-icons/fi';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface ProfileAvatarUploaderProps {
  sizeClass?: string;
  className?: string;
  editable?: boolean;
}

const compressAvatar = async (file: File): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = reject;
    img.src = objectUrl;
  });

  const maxSize = 128;
  const ratio = Math.min(maxSize / image.width, maxSize / image.height, 1);
  const width = Math.max(64, Math.round(image.width * ratio));
  const height = Math.max(64, Math.round(image.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to process image');

  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.45);
  });

  if (!blob) throw new Error('Failed to compress image');
  return blob;
};

export const ProfileAvatarUploader: React.FC<ProfileAvatarUploaderProps> = ({
  sizeClass = 'w-10 h-10',
  className,
  editable = true,
}) => {
  const { user, refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const handlePick = () => {
    if (!editable || isUploading) return;
    inputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }

    setIsUploading(true);

    try {
      const compressed = await compressAvatar(file);
      const timestamp = Date.now();
      const filePath = `${user.id}/avatar-${timestamp}.jpg`;

      const { data: existingFiles } = await supabase.storage.from('avatars').list(user.id);
      if (existingFiles && existingFiles.length > 0) {
        const oldPaths = existingFiles.map((storedFile) => `${user.id}/${storedFile.name}`);
        await supabase.storage.from('avatars').remove(oldPaths);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressed, {
          upsert: false,
          contentType: 'image/jpeg',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = `${publicUrlData.publicUrl}?v=${timestamp}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshUser();
      toast.success('Profile picture updated.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Avatar className={cn(sizeClass, 'cursor-pointer')} onClick={handlePick}>
        <AvatarImage src={user.avatar} alt={user.name} className="object-cover" />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {user.name?.[0] || user.email?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>

      {editable && (
        <button
          type="button"
          onClick={handlePick}
          disabled={isUploading}
          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Upload profile picture"
        >
          {isUploading ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiCamera className="w-3.5 h-3.5" />}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
